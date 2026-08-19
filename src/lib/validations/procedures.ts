import { z } from "zod";

export const procedureConsumableSchema = z.object({
  inventory_item_id: z.string().uuid("Select a supply"),
  quantity_per_procedure: z.coerce.number().int().min(1, "Must be at least 1"),
});
export type ProcedureConsumableInput = z.infer<typeof procedureConsumableSchema>;

export const procedureCatalogSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional().or(z.literal("")),
  default_price: z.coerce.number().min(0).default(0),
  default_duration_minutes: z.coerce.number().int().min(0).optional(),
  consumables: z.array(procedureConsumableSchema).default([]),
});
export type ProcedureCatalogInput = z.infer<typeof procedureCatalogSchema>;

export const orderProcedureSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().or(z.literal("")),
  procedureId: z.string().uuid("Select a procedure"),
});
export type OrderProcedureInput = z.infer<typeof orderProcedureSchema>;
