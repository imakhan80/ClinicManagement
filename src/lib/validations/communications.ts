import { z } from "zod";

const channel = z.enum(["call", "sms", "email", "in_person"]);

export const communicationTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  channel,
  subject: z.string().optional().or(z.literal("")),
  body: z.string().min(1, "Message body is required"),
});
export type CommunicationTemplateInput = z.infer<typeof communicationTemplateSchema>;

export const logCommunicationSchema = z.object({
  patient_id: z.string().uuid(),
  channel,
  direction: z.enum(["outbound", "inbound"]).default("outbound"),
  subject: z.string().optional().or(z.literal("")),
  body: z.string().min(1, "Message body is required"),
  template_id: z.string().uuid().optional().or(z.literal("")),
});
export type LogCommunicationInput = z.infer<typeof logCommunicationSchema>;
