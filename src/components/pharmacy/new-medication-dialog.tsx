"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
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
import { createMedication } from "@/actions/pharmacy";

interface FormValues {
  name: string;
  form: string;
  strength: string;
  unitPrice: number;
  stockQuantity: number;
}

export function NewMedicationDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    await createMedication({
      name: values.name,
      form: values.form,
      strength: values.strength,
      unitPrice: Number(values.unitPrice) || 0,
      stockQuantity: Number(values.stockQuantity) || 0,
    });
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
            Add medication
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add medication</DialogTitle>
          <DialogDescription>Add an item to the pharmacy catalog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Form</Label>
              <Input placeholder="Tablet" {...register("form")} />
            </div>
            <div className="space-y-1.5">
              <Label>Strength</Label>
              <Input placeholder="500mg" {...register("strength")} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit price</Label>
              <Input type="number" step="0.01" {...register("unitPrice")} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock qty</Label>
              <Input type="number" {...register("stockQuantity")} />
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
