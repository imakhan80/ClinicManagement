"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  communicationTemplateSchema,
  logCommunicationSchema,
} from "@/lib/validations/communications";
import { getCurrentUser } from "@/lib/auth/get-profile";

export interface ActionResult {
  error?: string;
  id?: string;
}

export async function createCommunicationTemplate(input: unknown): Promise<ActionResult> {
  const parsed = communicationTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.from("communication_templates").insert({
    name: parsed.data.name,
    channel: parsed.data.channel,
    subject: parsed.data.subject || null,
    body: parsed.data.body,
  });
  if (error) return { error: error.message };

  revalidatePath("/communications");
  return {};
}

export async function logCommunication(input: unknown): Promise<ActionResult> {
  const parsed = logCommunicationSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.from("communication_logs").insert({
    patient_id: parsed.data.patient_id,
    channel: parsed.data.channel,
    direction: parsed.data.direction,
    subject: parsed.data.subject || null,
    body: parsed.data.body,
    template_id: parsed.data.template_id || null,
    logged_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/communications");
  revalidatePath(`/patients/${parsed.data.patient_id}`);
  return {};
}
