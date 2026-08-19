import { z } from "zod";

export const patientSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  emergency_contact_name: z.string().optional().or(z.literal("")),
  emergency_contact_phone: z.string().optional().or(z.literal("")),
  blood_type: z.string().optional().or(z.literal("")),
  allergies: z.array(z.string()).default([]),
  notes: z.string().optional().or(z.literal("")),
});
export type PatientInput = z.input<typeof patientSchema>;
