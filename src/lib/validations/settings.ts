import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  phone: z.string().optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const staffMemberSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2, "Enter a full name"),
  role: z.enum(["admin", "doctor", "nurse", "receptionist"]),
  phone: z.string().optional().or(z.literal("")),
});
export type StaffMemberInput = z.infer<typeof staffMemberSchema>;
