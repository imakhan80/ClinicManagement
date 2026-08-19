import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unit_price: z.coerce.number().min(0, "Unit price must be 0 or more"),
});
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

export const invoiceSchema = z.object({
  patient_id: z.string().uuid("Select a patient"),
  appointment_id: z.string().uuid().optional().or(z.literal("")),
  tax: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  due_date: z.string().optional().or(z.literal("")),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["cash", "card", "bank_transfer", "insurance", "other"]),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const refundSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["cash", "card", "bank_transfer", "insurance", "other"]),
  note: z.string().optional().or(z.literal("")),
});
export type RefundInput = z.infer<typeof refundSchema>;
