"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { appointmentSchema, type AppointmentInput } from "@/lib/validations/appointment";
import { createAppointment } from "@/actions/appointments";
import { createClient } from "@/lib/supabase/client";

interface Option {
  id: string;
  label: string;
}

export function AppointmentForm({
  patientId,
  onSuccess,
}: {
  patientId?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Option[]>([]);
  const [doctors, setDoctors] = useState<Option[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { patient_id: patientId ?? "", doctor_id: "", duration_minutes: 30, status: "scheduled" },
  });

  useEffect(() => {
    const supabase = createClient();
    if (!patientId) {
      supabase
        .from("patients")
        .select("id, full_name")
        .order("full_name")
        .then(({ data }) => setPatients((data ?? []).map((p) => ({ id: p.id, label: p.full_name }))));
    }
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("role", "doctor")
      .then(({ data }) => setDoctors((data ?? []).map((d) => ({ id: d.id, label: d.full_name }))));
  }, [patientId]);

  async function onSubmit(values: AppointmentInput) {
    setServerError(null);
    const result = await createAppointment(values);
    if (result.error) {
      setServerError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Appointment booked");
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!patientId && (
        <div className="space-y-1.5">
          <Label>Patient</Label>
          <Select value={watch("patient_id") ?? ""} onValueChange={(v) => setValue("patient_id", v ?? "")}>
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
          {errors.patient_id && (
            <p className="text-xs text-destructive">{errors.patient_id.message}</p>
          )}
        </div>
      )}

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
          <Label htmlFor="scheduled_at">Date &amp; time</Label>
          <Input id="scheduled_at" type="datetime-local" {...register("scheduled_at")} />
          {errors.scheduled_at && (
            <p className="text-xs text-destructive">{errors.scheduled_at.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duration_minutes">Duration (min)</Label>
          <Input id="duration_minutes" type="number" step={5} {...register("duration_minutes")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason for visit</Label>
        <Input id="reason" placeholder="Annual checkup" {...register("reason")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} {...register("notes")} />
      </div>

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Book appointment
      </Button>
    </form>
  );
}
