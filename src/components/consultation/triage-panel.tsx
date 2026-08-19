"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Activity, ArrowRight, HeartPulse, Loader2, Thermometer, Weight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { saveTriage, sendToDoctor } from "@/actions/consultation";
import { flagVitals } from "@/lib/vitals";
import type { Database } from "@/lib/types/database";

type Triage = Database["public"]["Tables"]["triage_records"]["Row"];

interface FormValues {
  bpSystolic: string;
  bpDiastolic: string;
  pulseBpm: string;
  temperatureC: string;
  respiratoryRate: string;
  spo2: string;
  weightKg: string;
  heightCm: string;
  painScore: string;
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
  const [sentToDoctor, setSentToDoctor] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      bpSystolic: triage?.bp_systolic?.toString() ?? "",
      bpDiastolic: triage?.bp_diastolic?.toString() ?? "",
      pulseBpm: triage?.pulse_bpm?.toString() ?? "",
      temperatureC: triage?.temperature_c?.toString() ?? "",
      respiratoryRate: triage?.respiratory_rate?.toString() ?? "",
      spo2: triage?.spo2?.toString() ?? "",
      weightKg: triage?.weight_kg?.toString() ?? "",
      heightCm: triage?.height_cm?.toString() ?? "",
      painScore: triage?.pain_score?.toString() ?? "",
      chiefComplaint: triage?.chief_complaint ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const num = (s: string) => (s ? Number(s) : undefined);
    await saveTriage({
      appointmentId,
      patientId,
      bpSystolic: num(values.bpSystolic),
      bpDiastolic: num(values.bpDiastolic),
      pulseBpm: num(values.pulseBpm),
      temperatureC: num(values.temperatureC),
      respiratoryRate: num(values.respiratoryRate),
      spo2: num(values.spo2),
      weightKg: num(values.weightKg),
      heightCm: num(values.heightCm),
      painScore: num(values.painScore),
      chiefComplaint: values.chiefComplaint,
    });
    const heightM = values.heightCm ? Number(values.heightCm) / 100 : null;
    const bmi = heightM && values.weightKg ? Math.round((Number(values.weightKg) / (heightM * heightM)) * 10) / 10 : null;
    setSaved({
      ...(triage as Triage),
      bp_systolic: num(values.bpSystolic) ?? null,
      bp_diastolic: num(values.bpDiastolic) ?? null,
      pulse_bpm: num(values.pulseBpm) ?? null,
      temperature_c: num(values.temperatureC) ?? null,
      respiratory_rate: num(values.respiratoryRate) ?? null,
      spo2: num(values.spo2) ?? null,
      weight_kg: num(values.weightKg) ?? null,
      height_cm: num(values.heightCm) ?? null,
      pain_score: num(values.painScore) ?? null,
      bmi,
      chief_complaint: values.chiefComplaint,
    } as Triage);
  }

  const flags = saved
    ? flagVitals({
        bpSystolic: saved.bp_systolic,
        bpDiastolic: saved.bp_diastolic,
        pulseBpm: saved.pulse_bpm,
        temperatureC: saved.temperature_c,
        respiratoryRate: saved.respiratory_rate,
        spo2: saved.spo2,
        painScore: saved.pain_score,
        bmi: saved.bmi,
      })
    : [];

  return (
    <div className="space-y-4">
      {saved && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="gap-1 p-3.5">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <HeartPulse className="size-3.5" /> Blood pressure
              </p>
              <p className="text-sm font-semibold">
                {saved.bp_systolic && saved.bp_diastolic ? `${saved.bp_systolic}/${saved.bp_diastolic}` : "—"}
              </p>
            </Card>
            <Card className="gap-1 p-3.5">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="size-3.5" /> Pulse / Resp.
              </p>
              <p className="text-sm font-semibold">
                {saved.pulse_bpm ?? "—"} bpm · {saved.respiratory_rate ?? "—"}/min
              </p>
            </Card>
            <Card className="gap-1 p-3.5">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Thermometer className="size-3.5" /> Temp / SpO2
              </p>
              <p className="text-sm font-semibold">
                {saved.temperature_c ? `${saved.temperature_c}°C` : "—"} · {saved.spo2 ? `${saved.spo2}%` : "—"}
              </p>
            </Card>
            <Card className="gap-1 p-3.5">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Weight className="size-3.5" /> Weight / BMI
              </p>
              <p className="text-sm font-semibold">
                {saved.weight_kg ? `${saved.weight_kg} kg` : "—"} · {saved.bmi ?? "—"}
              </p>
            </Card>
          </div>
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {flags.map((f) => (
                <StatusBadge
                  key={f.label}
                  label={f.label}
                  tone={f.severity === "critical" ? "destructive" : "warning"}
                />
              ))}
            </div>
          )}
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label>BP systolic</Label>
            <Input type="number" placeholder="120" {...register("bpSystolic")} />
          </div>
          <div className="space-y-1.5">
            <Label>BP diastolic</Label>
            <Input type="number" placeholder="80" {...register("bpDiastolic")} />
          </div>
          <div className="space-y-1.5">
            <Label>Pulse (bpm)</Label>
            <Input type="number" {...register("pulseBpm")} />
          </div>
          <div className="space-y-1.5">
            <Label>Resp. rate (/min)</Label>
            <Input type="number" {...register("respiratoryRate")} />
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
          <div className="space-y-1.5">
            <Label>Pain score (0–10)</Label>
            <Input type="number" min={0} max={10} {...register("painScore")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Chief complaint</Label>
          <Textarea rows={2} placeholder="What brought the patient in today…" {...register("chiefComplaint")} />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            Save vitals
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || sentToDoctor}
            onClick={() =>
              startTransition(async () => {
                await sendToDoctor(appointmentId);
                setSentToDoctor(true);
              })
            }
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowRight className="size-3.5" />}
            {sentToDoctor ? "Sent to doctor" : "Send to doctor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
