"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { appointmentSchema } from "@/lib/validations/appointment";
import { getCurrentUser } from "@/lib/auth/get-profile";
import type { AppointmentStatus } from "@/lib/types/database";

export interface ActionResult {
  error?: string;
  id?: string;
}

export async function createAppointment(input: unknown): Promise<ActionResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: parsed.data.patient_id,
      doctor_id: parsed.data.doctor_id || null,
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
      duration_minutes: parsed.data.duration_minutes,
      status: parsed.data.status,
      reason: parsed.data.reason || null,
      notes: parsed.data.notes || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/appointments");
  revalidatePath("/queue");
  revalidatePath("/dashboard");
  return { id };
}

export async function checkInAppointment(id: string, patientId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("queue_entries")
    .select("id", { count: "exact", head: true })
    .gte("checked_in_at", startOfDay.toISOString());

  const { error: queueError } = await supabase.from("queue_entries").insert({
    appointment_id: id,
    patient_id: patientId,
    queue_number: (count ?? 0) + 1,
  });
  if (queueError) return { error: queueError.message };

  const { error: apptError } = await supabase
    .from("appointments")
    .update({ status: "checked_in" })
    .eq("id", id);
  if (apptError) return { error: apptError.message };

  revalidatePath("/appointments");
  revalidatePath("/queue");
  revalidatePath("/dashboard");
  return { id };
}
