"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarCog, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { rescheduleSchema, type RescheduleInput } from "@/lib/validations/appointment";
import { rescheduleAppointment } from "@/actions/appointments";
import { createClient } from "@/lib/supabase/client";

interface Option {
  id: string;
  label: string;
}

export function RescheduleAppointmentDialog({
  appointmentId,
  scheduledAt,
  durationMinutes,
  doctorId,
  reason,
  notes,
  open,
  onOpenChange,
}: {
  appointmentId: string;
  scheduledAt: string;
  durationMinutes: number;
  doctorId: string | null;
  reason: string | null;
  notes: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Option[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RescheduleInput>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      doctor_id: doctorId ?? "",
      scheduled_at: format(new Date(scheduledAt), "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: durationMinutes,
      reason: reason ?? "",
      notes: notes ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    reset({
      doctor_id: doctorId ?? "",
      scheduled_at: format(new Date(scheduledAt), "yyyy-MM-dd'T'HH:mm"),
      duration_minutes: durationMinutes,
      reason: reason ?? "",
      notes: notes ?? "",
    });
    createClient()
      .from("profiles")
      .select("id, full_name")
      .eq("role", "doctor")
      .then(({ data }) => setDoctors((data ?? []).map((d) => ({ id: d.id, label: d.full_name }))));
  }, [open, doctorId, scheduledAt, durationMinutes, reason, notes, reset]);

  async function onSubmit(values: RescheduleInput) {
    setServerError(null);
    const result = await rescheduleAppointment(appointmentId, values);
    if (result.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Appointment rescheduled");
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>Update the time, doctor, or details for this visit.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Doctor</Label>
            <Select value={watch("doctor_id") ?? ""} onValueChange={(v) => setValue("doctor_id", v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Any available doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    Dr. {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule_scheduled_at">Date &amp; time</Label>
              <Input id="reschedule_scheduled_at" type="datetime-local" {...register("scheduled_at")} />
              {errors.scheduled_at && (
                <p className="text-xs text-destructive">{errors.scheduled_at.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reschedule_duration_minutes">Duration (min)</Label>
              <Input
                id="reschedule_duration_minutes"
                type="number"
                step={5}
                {...register("duration_minutes")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reschedule_reason">Reason for visit</Label>
            <Input id="reschedule_reason" placeholder="Annual checkup" {...register("reason")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reschedule_notes">Notes</Label>
            <Textarea id="reschedule_notes" rows={2} {...register("notes")} />
          </div>

          {serverError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            <CalendarCog className="size-4" />
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
