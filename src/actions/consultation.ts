"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";

export interface ActionResult {
  error?: string;
  id?: string;
}

export async function saveTriage(input: {
  appointmentId: string;
  patientId: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  pulseBpm?: number;
  temperatureC?: number;
  respiratoryRate?: number;
  spo2?: number;
  weightKg?: number;
  heightCm?: number;
  painScore?: number;
  chiefComplaint?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.from("triage_records").insert({
    appointment_id: input.appointmentId,
    patient_id: input.patientId,
    taken_by: user.id,
    bp_systolic: input.bpSystolic ?? null,
    bp_diastolic: input.bpDiastolic ?? null,
    pulse_bpm: input.pulseBpm ?? null,
    temperature_c: input.temperatureC ?? null,
    respiratory_rate: input.respiratoryRate ?? null,
    spo2: input.spo2 ?? null,
    weight_kg: input.weightKg ?? null,
    height_cm: input.heightCm ?? null,
    pain_score: input.painScore ?? null,
    chief_complaint: input.chiefComplaint || null,
  });
  if (error) return { error: error.message };

  await supabase
    .from("queue_entries")
    .update({ status: "triaged" })
    .eq("appointment_id", input.appointmentId);

  revalidatePath(`/consultation/${input.appointmentId}`);
  revalidatePath("/queue");
  return {};
}

export async function sendToDoctor(appointmentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("queue_entries")
    .update({ status: "ready" })
    .eq("appointment_id", appointmentId);
  if (error) return { error: error.message };

  revalidatePath(`/consultation/${appointmentId}`);
  revalidatePath("/queue");
  return {};
}

export async function saveSoapNote(input: {
  appointmentId: string;
  patientId: string;
  subjective?: string;
  objective?: string;
  assessment: string;
  plan?: string;
  complete?: boolean;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.from("medical_records").upsert(
    {
      appointment_id: input.appointmentId,
      patient_id: input.patientId,
      doctor_id: user.id,
      soap_subjective: input.subjective || null,
      soap_objective: input.objective || null,
      diagnosis: input.assessment,
      soap_plan: input.plan || null,
      status: input.complete ? "completed" : "draft",
    },
    { onConflict: "appointment_id" }
  );
  if (error) return { error: error.message };

  revalidatePath(`/consultation/${input.appointmentId}`);
  revalidatePath(`/patients/${input.patientId}`);
  return {};
}

export async function saveNoteTemplate(input: {
  name: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.from("clinical_note_templates").insert({
    created_by: user.id,
    name: input.name,
    subjective: input.subjective || null,
    objective: input.objective || null,
    assessment: input.assessment || null,
    plan: input.plan || null,
  });
  if (error) return { error: error.message };

  return {};
}

export async function addInvestigation(input: {
  appointmentId: string;
  patientId: string;
  category: "lab" | "imaging" | "other";
  testName: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.from("investigations").insert({
    appointment_id: input.appointmentId,
    patient_id: input.patientId,
    ordered_by: user.id,
    category: input.category,
    test_name: input.testName,
  });
  if (error) return { error: error.message };

  revalidatePath(`/consultation/${input.appointmentId}`);
  return {};
}

export async function updateInvestigationResult(input: {
  id: string;
  appointmentId: string;
  status: "in_progress" | "completed" | "cancelled";
  resultText?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("investigations")
    .update({
      status: input.status,
      result_text: input.resultText || null,
      completed_at: input.status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", input.id);
  if (error) return { error: error.message };

  revalidatePath(`/consultation/${input.appointmentId}`);
  revalidatePath("/laboratory");
  return {};
}

export async function createPrescription(input: {
  appointmentId: string;
  patientId: string;
  notes?: string;
  items: { medicationName: string; dosage?: string; frequency?: string; duration?: string; quantity: number; instructions?: string }[];
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { data: prescription, error } = await supabase
    .from("prescriptions")
    .insert({
      appointment_id: input.appointmentId,
      patient_id: input.patientId,
      doctor_id: user.id,
      notes: input.notes || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: itemsError } = await supabase.from("prescription_items").insert(
    input.items.map((item) => ({
      prescription_id: prescription.id,
      medication_name: item.medicationName,
      dosage: item.dosage || null,
      frequency: item.frequency || null,
      duration: item.duration || null,
      quantity: item.quantity,
      instructions: item.instructions || null,
    }))
  );
  if (itemsError) return { error: itemsError.message };

  revalidatePath(`/consultation/${input.appointmentId}`);
  revalidatePath("/pharmacy");
  return { id: prescription.id };
}

export async function createFollowUp(input: {
  appointmentId: string;
  patientId: string;
  recommendedDate: string;
  reason?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.from("follow_ups").insert({
    appointment_id: input.appointmentId,
    patient_id: input.patientId,
    doctor_id: user.id,
    recommended_date: input.recommendedDate,
    reason: input.reason || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/consultation/${input.appointmentId}`);
  revalidatePath("/follow-ups");
  return {};
}
