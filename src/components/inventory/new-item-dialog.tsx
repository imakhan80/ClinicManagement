"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createInventoryItem } from "@/actions/inventory";

interface FormValues {
  name: string;
  category: string;
  unit: string;
  unit_cost: number;
  stock_quantity: number;
  reorder_level: number;
}

export function NewItemDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    const result = await createInventoryItem(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Item added");
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
            Add item
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add inventory item</DialogTitle>
          <DialogDescription>Add a supply or equipment item to the catalog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input placeholder="Consumable" {...register("category")} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input placeholder="Box" {...register("unit")} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit cost</Label>
              <Input type="number" step="0.01" {...register("unit_cost")} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock qty</Label>
              <Input type="number" {...register("stock_quantity")} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Reorder level</Label>
              <Input type="number" {...register("reorder_level")} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            Add
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
