import { z } from "zod";

export const appointmentSchema = z.object({
  patient_id: z.string().uuid("Select a patient"),
  doctor_id: z.string().uuid("Select a doctor").optional().or(z.literal("")),
  scheduled_at: z.string().min(1, "Select a date and time"),
  duration_minutes: z.coerce.number().int().min(5).max(480).default(30),
  status: z
    .enum(["scheduled", "checked_in", "in_progress", "completed", "cancelled", "no_show"])
    .default("scheduled"),
  reason: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});
export type AppointmentInput = z.input<typeof appointmentSchema>;

export const rescheduleSchema = z.object({
  doctor_id: z.string().uuid("Select a doctor").optional().or(z.literal("")),
  scheduled_at: z.string().min(1, "Select a date and time"),
  duration_minutes: z.coerce.number().int().min(5).max(480).default(30),
  reason: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});
export type RescheduleInput = z.input<typeof rescheduleSchema>;
