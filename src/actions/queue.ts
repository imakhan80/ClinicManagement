"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
}

export async function markTriaged(queueEntryId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "triaged" })
    .eq("id", queueEntryId);
  if (error) return { error: error.message };
  revalidatePath("/queue");
  return {};
}

export async function callToConsult(
  queueEntryId: string,
  appointmentId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error: qError } = await supabase
    .from("queue_entries")
    .update({ status: "in_consult", called_at: new Date().toISOString() })
    .eq("id", queueEntryId);
  if (qError) return { error: qError.message };

  const { error: aError } = await supabase
    .from("appointments")
    .update({ status: "in_progress" })
    .eq("id", appointmentId);
  if (aError) return { error: aError.message };

  revalidatePath("/queue");
  revalidatePath("/appointments");
  return {};
}

export async function completeQueueEntry(
  queueEntryId: string,
  appointmentId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error: qError } = await supabase
    .from("queue_entries")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", queueEntryId);
  if (qError) return { error: qError.message };

  const { error: aError } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", appointmentId);
  if (aError) return { error: aError.message };

  revalidatePath("/queue");
  revalidatePath("/appointments");
  revalidatePath("/dashboard");
  return {};
}
