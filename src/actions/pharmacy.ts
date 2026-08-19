"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";

export interface ActionResult {
  error?: string;
}

export async function dispenseItem(input: {
  prescriptionItemId: string;
  quantity: number;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (input.quantity <= 0) return { error: "Quantity must be greater than 0" };

  const supabase = await createClient();

  const { data: item, error: itemError } = await supabase
    .from("prescription_items")
    .select("medication_name, quantity, quantity_dispensed")
    .eq("id", input.prescriptionItemId)
    .single();
  if (itemError || !item) return { error: itemError?.message ?? "Prescription item not found" };

  const remaining = item.quantity - item.quantity_dispensed;
  if (input.quantity > remaining) {
    return { error: `Cannot dispense more than the remaining ${remaining} unit(s).` };
  }

  const { data: medication } = await supabase
    .from("medications")
    .select("id")
    .ilike("name", item.medication_name)
    .maybeSingle();

  const { error } = await supabase.from("dispenses").insert({
    prescription_item_id: input.prescriptionItemId,
    medication_id: medication?.id ?? null,
    quantity_dispensed: input.quantity,
    dispensed_by: user.id,
  });
  if (error) {
    if (error.code === "23514") {
      return { error: "Not enough stock in the pharmacy catalog to dispense this quantity." };
    }
    return { error: error.message };
  }

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
