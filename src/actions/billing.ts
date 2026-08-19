"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invoiceSchema, paymentSchema } from "@/lib/validations/invoice";
import { getCurrentUser } from "@/lib/auth/get-profile";

export interface ActionResult {
  error?: string;
  id?: string;
}

export async function createInvoice(input: unknown): Promise<ActionResult> {
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const subtotal = parsed.data.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const total = subtotal + parsed.data.tax;

  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      patient_id: parsed.data.patient_id,
      appointment_id: parsed.data.appointment_id || null,
      subtotal,
      tax: parsed.data.tax,
      total,
      due_date: parsed.data.due_date || null,
      status: "issued",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: itemsError } = await supabase.from("invoice_items").insert(
    parsed.data.items.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  );
  if (itemsError) return { error: itemsError.message };

  revalidatePath("/billing");
  return { id: invoice.id };
}

export async function recordPayment(invoiceId: string, input: unknown): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error: payError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount: parsed.data.amount,
    method: parsed.data.method,
    recorded_by: user.id,
  });
  if (payError) return { error: payError.message };

  const { data: invoice } = await supabase
    .from("invoices")
    .select("total")
    .eq("id", invoiceId)
    .single();

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId);

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const status = invoice && totalPaid >= Number(invoice.total) ? "paid" : "partially_paid";

  const { error: statusError } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId);
  if (statusError) return { error: statusError.message };

  revalidatePath("/billing");
  revalidatePath(`/billing/${invoiceId}`);
  return { id: invoiceId };
}
