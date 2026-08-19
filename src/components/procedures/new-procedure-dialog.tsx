"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createProcedureCatalogItem } from "@/actions/procedures";
import { createClient } from "@/lib/supabase/client";

interface FormValues {
  name: string;
  category: string;
  default_price: number;
  default_duration_minutes: number;
}

interface ConsumableRow {
  key: number;
  inventory_item_id: string;
  quantity_per_procedure: number;
}

export function NewProcedureDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [consumables, setConsumables] = useState<ConsumableRow[]>([]);
  const [nextKey, setNextKey] = useState(0);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { name: "", category: "", default_price: 0, default_duration_minutes: 30 },
  });

  useEffect(() => {
    if (!open || items.length > 0) return;
    createClient()
      .from("inventory_items")
      .select("id, name")
      .order("name")
      .then(({ data }) => setItems((data ?? []).map((i) => ({ id: i.id, label: i.name }))));
  }, [open, items.length]);

  function addConsumableRow() {
    setConsumables((prev) => [...prev, { key: nextKey, inventory_item_id: "", quantity_per_procedure: 1 }]);
    setNextKey((k) => k + 1);
  }

  function removeConsumableRow(key: number) {
    setConsumables((prev) => prev.filter((c) => c.key !== key));
  }

  function updateConsumableRow(key: number, patch: Partial<ConsumableRow>) {
    setConsumables((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  async function onSubmit(values: FormValues) {
    const validConsumables = consumables.filter((c) => c.inventory_item_id);
    const result = await createProcedureCatalogItem({
      ...values,
      consumables: validConsumables.map((c) => ({
        inventory_item_id: c.inventory_item_id,
        quantity_per_procedure: c.quantity_per_procedure,
      })),
    });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Procedure type added");
    reset();
    setConsumables([]);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Plus className="size-3.5" />
            New procedure type
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New procedure type</DialogTitle>
          <DialogDescription>Add to the catalog doctors order from during consultation.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name", { required: true })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input placeholder="Minor surgery" {...register("category")} />
            </div>
            <div className="space-y-1.5">
              <Label>Price</Label>
              <Input type="number" step="0.01" {...register("default_price")} />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" {...register("default_duration_minutes")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Consumables (optional)</Label>
            {consumables.map((row) => (
              <div key={row.key} className="grid grid-cols-6 gap-2">
                <div className="col-span-4">
                  <Select
                    value={row.inventory_item_id}
                    onValueChange={(v) => updateConsumableRow(row.key, { inventory_item_id: v ?? "" })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a supply" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  className="col-span-1"
                  value={row.quantity_per_procedure}
                  onChange={(e) =>
                    updateConsumableRow(row.key, { quantity_per_procedure: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeConsumableRow(row.key)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addConsumableRow}>
              <Plus className="size-3.5" />
              Add consumable
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
