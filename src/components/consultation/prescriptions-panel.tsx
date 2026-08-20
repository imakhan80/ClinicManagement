"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { Loader2, Pill, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { createPrescription } from "@/actions/consultation";
import { prescriptionStatus } from "@/lib/status";
import type { Database } from "@/lib/types/database";

type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"] & {
  prescription_items: Database["public"]["Tables"]["prescription_items"]["Row"][];
};

interface ItemForm {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

interface FormValues {
  items: ItemForm[];
}

export function PrescriptionsPanel({
  appointmentId,
  patientId,
  prescriptions,
  canPrescribe,
}: {
  appointmentId: string;
  patientId: string;
  prescriptions: Prescription[];
  canPrescribe: boolean;
}) {
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { items: [{ medicationName: "", dosage: "", frequency: "", duration: "", quantity: 1 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  async function onSubmit(values: FormValues) {
    await createPrescription({
      appointmentId,
      patientId,
      items: values.items.map((i) => ({
        medicationName: i.medicationName,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration,
        quantity: Number(i.quantity) || 1,
      })),
    });
    reset({ items: [{ medicationName: "", dosage: "", frequency: "", duration: "", quantity: 1 }] });
  }

  return (
    <div className="space-y-4">
      {prescriptions.length === 0 ? (
        <EmptyState icon={Pill} title="No prescriptions issued" />
      ) : (
        <div className="space-y-2.5">
          {prescriptions.map((rx) => {
            const meta = prescriptionStatus[rx.status] ?? prescriptionStatus.pending;
            return (
              <div key={rx.id} className="rounded-xl border border-border p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Prescription</p>
                  <StatusBadge label={meta.label} tone={meta.tone} />
                </div>
                <ul className="space-y-1">
                  {rx.prescription_items.map((item) => (
                    <li key={item.id} className="text-sm">
                      <span className="font-medium">{item.medication_name}</span>
                      {item.dosage && ` · ${item.dosage}`}
                      {item.frequency && ` · ${item.frequency}`}
                      {item.duration && ` · ${item.duration}`}
                      {` · qty ${item.quantity}`}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {canPrescribe && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 border-t border-border pt-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-2 gap-2 rounded-lg border border-border p-2.5 sm:grid-cols-6">
              <Input
                placeholder="Medication"
                className="sm:col-span-2"
                {...register(`items.${index}.medicationName`, { required: true })}
              />
              <Input placeholder="Dosage" {...register(`items.${index}.dosage`)} />
              <Input placeholder="Frequency" {...register(`items.${index}.frequency`)} />
              <Input placeholder="Duration" {...register(`items.${index}.duration`)} />
              <div className="flex gap-1">
                <Input type="number" min={1} placeholder="Qty" {...register(`items.${index}.quantity`)} />
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove medication" onClick={() => remove(index)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ medicationName: "", dosage: "", frequency: "", duration: "", quantity: 1 })}
            >
              <Plus className="size-3.5" />
              Add medication
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              Issue prescription
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
