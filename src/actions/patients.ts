"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { patientSchema } from "@/lib/validations/patient";
import { getCurrentUser } from "@/lib/auth/get-profile";

export interface ActionResult {
  error?: string;
  id?: string;
}

export async function createPatient(input: unknown): Promise<ActionResult> {
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      ...parsed.data,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      emergency_contact_name: parsed.data.emergency_contact_name || null,
      emergency_contact_phone: parsed.data.emergency_contact_phone || null,
      blood_type: parsed.data.blood_type || null,
      notes: parsed.data.notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/patients");
  return { id: data.id };
}

export async function updatePatient(id: string, input: unknown): Promise<ActionResult> {
  const parsed = patientSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("patients")
    .update({
      ...parsed.data,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      emergency_contact_name: parsed.data.emergency_contact_name || null,
      emergency_contact_phone: parsed.data.emergency_contact_phone || null,
      blood_type: parsed.data.blood_type || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/patients");
  revalidatePath(`/patients/${id}`);
  return { id };
}
