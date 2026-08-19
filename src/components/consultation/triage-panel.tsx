"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Activity, HeartPulse, Loader2, Thermometer, Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { saveTriage } from "@/actions/consultation";
import type { Database } from "@/lib/types/database";

type Triage = Database["public"]["Tables"]["triage_records"]["Row"];

interface FormValues {
  bloodPressure: string;
  pulseBpm: string;
  temperatureC: string;
  spo2: string;
  weightKg: string;
  heightCm: string;
  chiefComplaint: string;
}

export function TriagePanel({
  appointmentId,
  patientId,
  triage,
}: {
  appointmentId: string;
  patientId: string;
  triage: Triage | null;
}) {
  const [saved, setSaved] = useState<Triage | null>(triage);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      bloodPressure: triage?.blood_pressure ?? "",
      pulseBpm: triage?.pulse_bpm?.toString() ?? "",
      temperatureC: triage?.temperature_c?.toString() ?? "",
      spo2: triage?.spo2?.toString() ?? "",
      weightKg: triage?.weight_kg?.toString() ?? "",
      heightCm: triage?.height_cm?.toString() ?? "",
      chiefComplaint: triage?.chief_complaint ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    await saveTriage({
      appointmentId,
      patientId,
      bloodPressure: values.bloodPressure,
      pulseBpm: values.pulseBpm ? Number(values.pulseBpm) : undefined,
      temperatureC: values.temperatureC ? Number(values.temperatureC) : undefined,
      spo2: values.spo2 ? Number(values.spo2) : undefined,
      weightKg: values.weightKg ? Number(values.weightKg) : undefined,
      heightCm: values.heightCm ? Number(values.heightCm) : undefined,
      chiefComplaint: values.chiefComplaint,
    });
    setSaved({
      ...(triage as Triage),
      blood_pressure: values.bloodPressure,
      chief_complaint: values.chiefComplaint,
    } as Triage);
  }

  return (
    <div className="space-y-4">
      {saved && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="gap-1 p-3.5">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HeartPulse className="size-3.5" /> Blood pressure
            </p>
            <p className="text-sm font-semibold">{saved.blood_pressure || "—"}</p>
          </Card>
          <Card className="gap-1 p-3.5">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="size-3.5" /> Pulse
            </p>
            <p className="text-sm font-semibold">{saved.pulse_bpm ? `${saved.pulse_bpm} bpm` : "—"}</p>
          </Card>
          <Card className="gap-1 p-3.5">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Thermometer className="size-3.5" /> Temp
            </p>
            <p className="text-sm font-semibold">
              {saved.temperature_c ? `${saved.temperature_c}°C` : "—"}
            </p>
          </Card>
          <Card className="gap-1 p-3.5">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Weight className="size-3.5" /> Weight
            </p>
            <p className="text-sm font-semibold">{saved.weight_kg ? `${saved.weight_kg} kg` : "—"}</p>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Blood pressure</Label>
            <Input placeholder="120/80" {...register("bloodPressure")} />
          </div>
          <div className="space-y-1.5">
            <Label>Pulse (bpm)</Label>
            <Input type="number" {...register("pulseBpm")} />
          </div>
          <div className="space-y-1.5">
            <Label>Temperature (°C)</Label>
            <Input type="number" step="0.1" {...register("temperatureC")} />
          </div>
          <div className="space-y-1.5">
            <Label>SpO2 (%)</Label>
            <Input type="number" {...register("spo2")} />
          </div>
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input type="number" step="0.1" {...register("weightKg")} />
          </div>
          <div className="space-y-1.5">
            <Label>Height (cm)</Label>
            <Input type="number" step="0.1" {...register("heightCm")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Chief complaint</Label>
          <Textarea rows={2} placeholder="What brought the patient in today…" {...register("chiefComplaint")} />
        </div>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          Save vitals
        </Button>
      </form>
    </div>
  );
}
