"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  procedureCatalogSchema,
  orderProcedureSchema,
} from "@/lib/validations/procedures";
import { getCurrentUser } from "@/lib/auth/get-profile";

export interface ActionResult {
  error?: string;
  id?: string;
}

export async function createProcedureCatalogItem(input: unknown): Promise<ActionResult> {
  const parsed = procedureCatalogSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: procedure, error } = await supabase
    .from("procedure_catalog")
    .insert({
      name: parsed.data.name,
      category: parsed.data.category || null,
      default_price: parsed.data.default_price,
      default_duration_minutes: parsed.data.default_duration_minutes ?? null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (parsed.data.consumables.length > 0) {
    const { error: consumablesError } = await supabase.from("procedure_consumables").insert(
      parsed.data.consumables.map((c) => ({
        procedure_id: procedure.id,
        inventory_item_id: c.inventory_item_id,
        quantity_per_procedure: c.quantity_per_procedure,
      }))
    );
    if (consumablesError) return { error: consumablesError.message };
  }

  revalidatePath("/procedures");
  return { id: procedure.id };
}

export async function orderProcedure(input: unknown): Promise<ActionResult> {
  const parsed = orderProcedureSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: procedure, error: procedureError } = await supabase
    .from("procedure_catalog")
    .select("name, default_price")
    .eq("id", parsed.data.procedureId)
    .single();
  if (procedureError || !procedure) return { error: procedureError?.message ?? "Procedure not found" };

  const { error } = await supabase.from("procedure_orders").insert({
    appointment_id: parsed.data.appointmentId || null,
    patient_id: parsed.data.patientId,
    procedure_id: parsed.data.procedureId,
    procedure_name: procedure.name,
    price: procedure.default_price,
    ordered_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/procedures");
  if (parsed.data.appointmentId) revalidatePath(`/consultation/${parsed.data.appointmentId}`);
  return {};
}

export async function completeProcedureOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: order, error } = await supabase.rpc("complete_procedure_order", {
    p_order_id: orderId,
  });
  if (error) {
    if (error.code === "23514") {
      return { error: "One of this procedure's supplies is out of stock." };
    }
    return { error: error.message };
  }

  revalidatePath("/procedures");
  revalidatePath("/inventory");
  revalidatePath("/billing");
  if (order?.appointment_id) revalidatePath(`/consultation/${order.appointment_id}`);
  return {};
}

export async function cancelProcedureOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("procedure_orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "ordered");
  if (error) return { error: error.message };

  revalidatePath("/procedures");
  return {};
}

export async function billProcedureOrder(orderId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from("procedure_orders")
    .select("patient_id, appointment_id, procedure_name, price, status, invoice_id")
    .eq("id", orderId)
    .single();
  if (orderError || !order) return { error: orderError?.message ?? "Procedure order not found" };
  if (order.status !== "completed") return { error: "Only a completed procedure can be billed." };
  if (order.invoice_id) return { error: "This procedure has already been billed." };

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      patient_id: order.patient_id,
      appointment_id: order.appointment_id,
      subtotal: order.price,
      tax: 0,
      discount: 0,
      total: order.price,
      status: "issued",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (invoiceError) return { error: invoiceError.message };

  const { error: itemError } = await supabase.from("invoice_items").insert({
    invoice_id: invoice.id,
    description: order.procedure_name,
    quantity: 1,
    unit_price: order.price,
  });
  if (itemError) return { error: itemError.message };

  const { error: linkError } = await supabase
    .from("procedure_orders")
    .update({ invoice_id: invoice.id })
    .eq("id", orderId);
  if (linkError) return { error: linkError.message };

  revalidatePath("/procedures");
  revalidatePath("/billing");
  return { id: invoice.id };
}
