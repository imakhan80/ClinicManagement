import { z } from "zod";

export const inventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional().or(z.literal("")),
  unit: z.string().optional().or(z.literal("")),
  unit_cost: z.coerce.number().min(0).default(0),
  stock_quantity: z.coerce.number().min(0).default(0),
  reorder_level: z.coerce.number().min(0).default(10),
});
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

export const adjustStockSchema = z.object({
  item_id: z.string().uuid(),
  change_qty: z.coerce.number().int().refine((v) => v !== 0, "Enter a non-zero amount"),
  reason: z.enum(["received", "adjustment", "wastage"]),
  note: z.string().optional().or(z.literal("")),
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
