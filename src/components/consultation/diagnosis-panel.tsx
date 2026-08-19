"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveDiagnosis } from "@/actions/consultation";
import type { Database } from "@/lib/types/database";

type MedicalRecord = Database["public"]["Tables"]["medical_records"]["Row"];

interface FormValues {
  diagnosis: string;
  notes: string;
}

export function DiagnosisPanel({
  appointmentId,
  patientId,
  record,
  canEdit,
}: {
  appointmentId: string;
  patientId: string;
  record: MedicalRecord | null;
  canEdit: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      diagnosis: record?.diagnosis ?? "",
      notes: record?.prescription ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    await saveDiagnosis({
      appointmentId,
      patientId,
      diagnosis: values.diagnosis,
      notes: values.notes,
    });
    setSaved(true);
  }

  if (!canEdit && !record) {
    return (
      <p className="text-sm text-muted-foreground">
        Diagnosis has not been recorded for this visit yet.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Diagnosis</Label>
        <Textarea
          rows={4}
          placeholder="Clinical impression, findings…"
          disabled={!canEdit}
          {...register("diagnosis")}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Additional notes</Label>
        <Textarea rows={3} disabled={!canEdit} {...register("notes")} />
      </div>
      {canEdit && (
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          Save diagnosis
        </Button>
      )}
      {saved && <p className="text-xs text-success">Saved.</p>}
    </form>
  );
}
