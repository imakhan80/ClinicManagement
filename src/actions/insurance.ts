"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  insuranceProviderSchema,
  patientPolicySchema,
  fileClaimSchema,
  decideClaimSchema,
} from "@/lib/validations/insurance";
import { getCurrentUser } from "@/lib/auth/get-profile";

export interface ActionResult {
  error?: string;
  id?: string;
}

export async function createInsuranceProvider(input: unknown): Promise<ActionResult> {
  const parsed = insuranceProviderSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.from("insurance_providers").insert({
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/insurance");
  return {};
}

export async function addPatientPolicy(input: unknown): Promise<ActionResult> {
  const parsed = patientPolicySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.from("patient_insurance_policies").insert({
    patient_id: parsed.data.patient_id,
    provider_id: parsed.data.provider_id,
    policy_number: parsed.data.policy_number,
    group_number: parsed.data.group_number || null,
    coverage_percent: parsed.data.coverage_percent,
    is_primary: parsed.data.is_primary,
    valid_from: parsed.data.valid_from || null,
    valid_to: parsed.data.valid_to || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/patients/${parsed.data.patient_id}`);
  return {};
}

export async function fileClaim(input: unknown): Promise<ActionResult> {
  const parsed = fileClaimSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { data: claim, error } = await supabase
    .from("insurance_claims")
    .insert({
      invoice_id: parsed.data.invoice_id,
      policy_id: parsed.data.policy_id,
      claimed_amount: parsed.data.claimed_amount,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/billing/${parsed.data.invoice_id}`);
  return { id: claim.id };
}

export async function decideClaim(input: unknown): Promise<ActionResult> {
  const parsed = decideClaimSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: claim, error: claimError } = await supabase
    .from("insurance_claims")
    .select("invoice_id, status")
    .eq("id", parsed.data.claim_id)
    .single();
  if (claimError || !claim) return { error: claimError?.message ?? "Claim not found" };
  if (claim.status !== "submitted") return { error: "Only a submitted claim can be decided." };

  const { error: updateError } = await supabase
    .from("insurance_claims")
    .update({
      status: parsed.data.status,
      approved_amount: parsed.data.approved_amount ?? null,
      decided_at: new Date().toISOString(),
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.claim_id);
  if (updateError) return { error: updateError.message };

  const amount = parsed.data.approved_amount ?? 0;
  if ((parsed.data.status === "approved" || parsed.data.status === "paid") && amount > 0) {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("total")
      .eq("id", claim.invoice_id)
      .single();
    if (invoiceError || !invoice) return { error: invoiceError?.message ?? "Invoice not found" };

    const { data: existingPayments } = await supabase
      .from("payments")
      .select("amount, is_refund")
      .eq("invoice_id", claim.invoice_id);
    const alreadyPaid = (existingPayments ?? []).reduce(
      (sum, p) => sum + (p.is_refund ? -Number(p.amount) : Number(p.amount)),
      0
    );

    const { error: payError } = await supabase.from("payments").insert({
      invoice_id: claim.invoice_id,
      amount,
      method: "insurance",
      recorded_by: user.id,
    });
    if (payError) return { error: payError.message };

    const totalPaid = alreadyPaid + amount;
    const status = totalPaid >= Number(invoice.total) ? "paid" : "partially_paid";
    const { error: statusError } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", claim.invoice_id);
    if (statusError) return { error: statusError.message };
  }

  revalidatePath(`/billing/${claim.invoice_id}`);
  revalidatePath("/billing");
  return {};
}
