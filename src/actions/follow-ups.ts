"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";

export interface ActionResult {
  error?: string;
}

export async function scheduleFollowUp(input: {
  followUpId: string;
  patientId: string;
  doctorId?: string;
  scheduledAt: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { data: appointment, error: apptError } = await supabase
    .from("appointments")
    .insert({
      patient_id: input.patientId,
      doctor_id: input.doctorId || null,
      scheduled_at: new Date(input.scheduledAt).toISOString(),
      reason: "Follow-up",
      created_by: user.id,
    })
    .select("id")
    .single();
  if (apptError) return { error: apptError.message };

  const { error } = await supabase
    .from("follow_ups")
    .update({ status: "scheduled", scheduled_appointment_id: appointment.id })
    .eq("id", input.followUpId);
  if (error) return { error: error.message };

  revalidatePath("/follow-ups");
  revalidatePath("/appointments");
  return {};
}
