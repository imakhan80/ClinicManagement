"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { CalendarCheck2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFollowUp } from "@/actions/consultation";

interface FormValues {
  recommendedDate: string;
  reason: string;
}

export function FollowUpPanel({
  appointmentId,
  patientId,
  canSchedule,
}: {
  appointmentId: string;
  patientId: string;
  canSchedule: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    await createFollowUp({ appointmentId, patientId, ...values });
    setSaved(true);
  }

  if (!canSchedule) {
    return (
      <p className="text-sm text-muted-foreground">
        Only the treating doctor can recommend a follow-up.
      </p>
    );
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <CalendarCheck2 className="size-4" />
        Follow-up recommendation saved.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Recommended date</Label>
          <Input type="date" {...register("recommendedDate", { required: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Input placeholder="Review labs" {...register("reason")} />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
        Save follow-up
      </Button>
    </form>
  );
}
