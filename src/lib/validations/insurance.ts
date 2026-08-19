import { z } from "zod";

export const insuranceProviderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});
export type InsuranceProviderInput = z.infer<typeof insuranceProviderSchema>;

export const patientPolicySchema = z.object({
  patient_id: z.string().uuid(),
  provider_id: z.string().uuid("Select a provider"),
  policy_number: z.string().min(1, "Policy number is required"),
  group_number: z.string().optional().or(z.literal("")),
  coverage_percent: z.coerce.number().min(0).max(100).default(80),
  is_primary: z.boolean().default(true),
  valid_from: z.string().optional().or(z.literal("")),
  valid_to: z.string().optional().or(z.literal("")),
});
export type PatientPolicyInput = z.infer<typeof patientPolicySchema>;

export const fileClaimSchema = z.object({
  invoice_id: z.string().uuid(),
  policy_id: z.string().uuid("Select a policy"),
  claimed_amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});
export type FileClaimInput = z.infer<typeof fileClaimSchema>;

export const decideClaimSchema = z.object({
  claim_id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "paid"]),
  approved_amount: z.coerce.number().min(0).optional(),
  notes: z.string().optional().or(z.literal("")),
});
export type DecideClaimInput = z.infer<typeof decideClaimSchema>;
