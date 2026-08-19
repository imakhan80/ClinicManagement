"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { createInvoice } from "@/actions/billing";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";

interface FormValues {
  patient_id: string;
  tax: number;
  discount: number;
  due_date: string;
  items: { description: string; quantity: number; unit_price: number }[];
}

export function InvoiceForm({
  patientId,
  onSuccess,
}: {
  patientId?: string;
  onSuccess?: (id: string) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [patients, setPatients] = useState<{ id: string; label: string }[]>([]);

  const { register, control, handleSubmit, watch, setValue, formState: { isSubmitting, errors } } =
    useForm<FormValues>({
      defaultValues: {
        patient_id: patientId ?? "",
        tax: 0,
        discount: 0,
        items: [{ description: "", quantity: 1, unit_price: 0 }],
      },
    });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (patientId) return;
    createClient()
      .from("patients")
      .select("id, full_name")
      .order("full_name")
      .then(({ data }) => setPatients((data ?? []).map((p) => ({ id: p.id, label: p.full_name }))));
  }, [patientId]);

  const items = watch("items");
  const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const tax = Number(watch("tax")) || 0;
  const discount = Number(watch("discount")) || 0;

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await createInvoice(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.refresh();
    if (result.id) onSuccess?.(result.id);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {!patientId && (
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Select value={watch("patient_id")} onValueChange={(v) => setValue("patient_id", v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.patient_id && <p className="text-xs text-destructive">Select a patient</p>}
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Due date</Label>
          <Input type="date" {...register("due_date")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Line items</Label>
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-6 gap-2">
            <Input
              placeholder="Description"
              className="col-span-3"
              {...register(`items.${index}.description`, { required: true })}
            />
            <Input
              type="number"
              min={0.01}
              step="0.01"
              placeholder="Qty"
              {...register(`items.${index}.quantity`, { required: true, valueAsNumber: true })}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="Price"
              {...register(`items.${index}.unit_price`, { required: true, valueAsNumber: true })}
            />
            {fields.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
        >
          <Plus className="size-3.5" />
          Add line
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Tax</Label>
          <Input type="number" step="0.01" {...register("tax", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Discount</Label>
          <Input type="number" step="0.01" {...register("discount", { valueAsNumber: true })} />
        </div>
        <div className="flex flex-col justify-end text-right">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatCurrency(Math.max(0, subtotal + tax - discount))}
          </p>
        </div>
      </div>

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Create invoice
      </Button>
    </form>
  );
}
