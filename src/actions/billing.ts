"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invoiceSchema, paymentSchema, refundSchema } from "@/lib/validations/invoice";
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
  const total = Math.max(0, subtotal + parsed.data.tax - parsed.data.discount);

  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      patient_id: parsed.data.patient_id,
      appointment_id: parsed.data.appointment_id || null,
      subtotal,
      tax: parsed.data.tax,
      discount: parsed.data.discount,
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

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("total, status")
    .eq("id", invoiceId)
    .single();
  if (invoiceError || !invoice) return { error: invoiceError?.message ?? "Invoice not found" };
  if (invoice.status === "void") return { error: "This invoice has been voided." };

  const { data: existingPayments } = await supabase
    .from("payments")
    .select("amount, is_refund")
    .eq("invoice_id", invoiceId);

  const alreadyPaid = (existingPayments ?? []).reduce(
    (sum, p) => sum + (p.is_refund ? -Number(p.amount) : Number(p.amount)),
    0
  );
  const remaining = Number(invoice.total) - alreadyPaid;

  if (parsed.data.amount > remaining + 0.001) {
    return { error: `Amount exceeds the remaining balance of $${remaining.toFixed(2)}.` };
  }

  const { error: payError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount: parsed.data.amount,
    method: parsed.data.method,
    recorded_by: user.id,
  });
  if (payError) return { error: payError.message };

  const totalPaid = alreadyPaid + parsed.data.amount;
  const status = totalPaid >= Number(invoice.total) ? "paid" : "partially_paid";

  const { error: statusError } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId);
  if (statusError) return { error: statusError.message };

  revalidatePath("/billing");
  revalidatePath(`/billing/${invoiceId}`);
  return { id: invoiceId };
}

export async function recordRefund(invoiceId: string, input: unknown): Promise<ActionResult> {
  const parsed = refundSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("total")
    .eq("id", invoiceId)
    .single();
  if (invoiceError || !invoice) return { error: invoiceError?.message ?? "Invoice not found" };

  const { data: existingPayments } = await supabase
    .from("payments")
    .select("amount, is_refund")
    .eq("invoice_id", invoiceId);

  const alreadyPaid = (existingPayments ?? []).reduce(
    (sum, p) => sum + (p.is_refund ? -Number(p.amount) : Number(p.amount)),
    0
  );

  if (parsed.data.amount > alreadyPaid + 0.001) {
    return { error: `Cannot refund more than the $${alreadyPaid.toFixed(2)} already paid.` };
  }

  const { error: refundError } = await supabase.from("payments").insert({
    invoice_id: invoiceId,
    amount: parsed.data.amount,
    method: parsed.data.method,
    recorded_by: user.id,
    is_refund: true,
    note: parsed.data.note || null,
  });
  if (refundError) return { error: refundError.message };

  const netPaid = alreadyPaid - parsed.data.amount;
  const status = netPaid <= 0 ? "issued" : netPaid >= Number(invoice.total) ? "paid" : "partially_paid";

  const { error: statusError } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId);
  if (statusError) return { error: statusError.message };

  revalidatePath("/billing");
  revalidatePath(`/billing/${invoiceId}`);
  return { id: invoiceId };
}

export async function voidInvoice(invoiceId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("id")
    .eq("invoice_id", invoiceId)
    .limit(1);
  if (payments && payments.length > 0) {
    return { error: "Cannot void an invoice that already has payments recorded." };
  }

  const { error } = await supabase.from("invoices").update({ status: "void" }).eq("id", invoiceId);
  if (error) return { error: error.message };

  revalidatePath("/billing");
  revalidatePath(`/billing/${invoiceId}`);
  return { id: invoiceId };
}
