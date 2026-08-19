"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
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
  consumables: { inventory_item_id: string; quantity_per_procedure: number }[];
}

export function NewProcedureDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);

  const { register, control, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { name: "", category: "", default_price: 0, default_duration_minutes: 30, consumables: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "consumables" });

  useEffect(() => {
    if (!open || items.length > 0) return;
    createClient()
      .from("inventory_items")
      .select("id, name")
      .order("name")
      .then(({ data }) => setItems((data ?? []).map((i) => ({ id: i.id, label: i.name }))));
  }, [open, items.length]);

  async function onSubmit(values: FormValues) {
    const result = await createProcedureCatalogItem(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Procedure type added");
    reset();
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
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-6 gap-2">
                <div className="col-span-4">
                  <Select
                    value={watch(`consumables.${index}.inventory_item_id`)}
                    onValueChange={(v) => setValue(`consumables.${index}.inventory_item_id`, v ?? "")}
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
                  {...register(`consumables.${index}.quantity_per_procedure`, { valueAsNumber: true })}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ inventory_item_id: "", quantity_per_procedure: 1 })}
            >
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
