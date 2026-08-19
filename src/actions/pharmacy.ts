"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";

export interface ActionResult {
  error?: string;
}

export async function dispenseItem(input: {
  prescriptionItemId: string;
  medicationId?: string;
  quantity: number;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.from("dispenses").insert({
    prescription_item_id: input.prescriptionItemId,
    medication_id: input.medicationId || null,
    quantity_dispensed: input.quantity,
    dispensed_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/pharmacy");
  return {};
}

export async function createMedication(input: {
  name: string;
  form?: string;
  strength?: string;
  unitPrice: number;
  stockQuantity: number;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("medications").insert({
    name: input.name,
    form: input.form || null,
    strength: input.strength || null,
    unit_price: input.unitPrice,
    stock_quantity: input.stockQuantity,
  });
  if (error) return { error: error.message };

  revalidatePath("/pharmacy");
  return {};
}
