"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { inventoryItemSchema, adjustStockSchema } from "@/lib/validations/inventory";
import { getCurrentUser } from "@/lib/auth/get-profile";

export interface ActionResult {
  error?: string;
  id?: string;
}

export async function createInventoryItem(input: unknown): Promise<ActionResult> {
  const parsed = inventoryItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").insert({
    name: parsed.data.name,
    category: parsed.data.category || null,
    unit: parsed.data.unit || null,
    unit_cost: parsed.data.unit_cost,
    stock_quantity: parsed.data.stock_quantity,
    reorder_level: parsed.data.reorder_level,
  });
  if (error) return { error: error.message };

  revalidatePath("/inventory");
  return {};
}

export async function adjustStock(input: unknown): Promise<ActionResult> {
  const parsed = adjustStockSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_movements").insert({
    item_id: parsed.data.item_id,
    change_qty: parsed.data.change_qty,
    reason: parsed.data.reason,
    note: parsed.data.note || null,
    created_by: user.id,
  });
  if (error) {
    if (error.code === "23514") {
      return { error: "That would take stock below zero." };
    }
    return { error: error.message };
  }

  revalidatePath("/inventory");
  return {};
}
