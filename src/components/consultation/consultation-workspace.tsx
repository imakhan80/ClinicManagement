"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { AlertTriangle, CheckCircle2, History, Loader2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { TriagePanel } from "@/components/consultation/triage-panel";
import { DiagnosisPanel } from "@/components/consultation/diagnosis-panel";
import { InvestigationsPanel } from "@/components/consultation/investigations-panel";
import { ProceduresPanel } from "@/components/consultation/procedures-panel";
import { PrescriptionsPanel } from "@/components/consultation/prescriptions-panel";
import { FollowUpPanel } from "@/components/consultation/follow-up-panel";
import { completeQueueEntry } from "@/actions/queue";
import { calculateAge, initials } from "@/lib/format";
import { flagVitals } from "@/lib/vitals";
import type { Database, Role } from "@/lib/types/database";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Patient = Database["public"]["Tables"]["patients"]["Row"];
type Triage = Database["public"]["Tables"]["triage_records"]["Row"];
type MedicalRecord = Database["public"]["Tables"]["medical_records"]["Row"];
type Investigation = Database["public"]["Tables"]["investigations"]["Row"];
type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"] & {
  prescription_items: Database["public"]["Tables"]["prescription_items"]["Row"][];
};
type ProcedureOrder = Database["public"]["Tables"]["procedure_orders"]["Row"];

export function ConsultationWorkspace({
  appointment,
  patient,
  queueEntry,
  triage,
  record,
  investigations,
  prescriptions,
  procedureOrders,
  currentUserRole,
}: {
  appointment: Appointment;
  patient: Patient;
  queueEntry: { id: string; status: string } | null;
  triage: Triage | null;
  record: MedicalRecord | null;
  investigations: Investigation[];
  prescriptions: Prescription[];
  procedureOrders: ProcedureOrder[];
  currentUserRole: Role;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const requestedTab = searchParams.get("tab");
  const validTabs = ["triage", "diagnosis", "investigations", "procedures", "prescriptions", "follow-up"];
  const initialTab = requestedTab && validTabs.includes(requestedTab) ? requestedTab : "triage";

  const isDoctor = currentUserRole === "doctor";
  const isClinical = currentUserRole === "doctor" || currentUserRole === "nurse" || currentUserRole === "admin";
  const canComplete = appointment.status !== "completed" && (isDoctor || currentUserRole === "admin");

  const vitalFlags = triage
    ? flagVitals({
        bpSystolic: triage.bp_systolic,
        bpDiastolic: triage.bp_diastolic,
        pulseBpm: triage.pulse_bpm,
        temperatureC: triage.temperature_c,
        respiratoryRate: triage.respiratory_rate,
        spo2: triage.spo2,
        painScore: triage.pain_score,
        bmi: triage.bmi,
      })
    : [];

  return (
    <div className="space-y-4">
      {canComplete && queueEntry && (
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await completeQueueEntry(queueEntry.id, appointment.id);
                router.push("/queue");
              })
            }
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            Complete visit
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Left: patient summary */}
        <Card className="gap-3 p-4 shadow-sm lg:col-span-1 lg:self-start">
          <div className="flex items-center gap-3">
            <Avatar className="size-11 shrink-0">
              <AvatarFallback className="bg-accent text-accent-foreground">
                {initials(patient.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{patient.full_name}</p>
              <p className="text-xs text-muted-foreground">{patient.mrn}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <p className="text-muted-foreground">Age</p>
            <p className="text-right font-medium">{calculateAge(patient.date_of_birth)} yrs</p>
            <p className="text-muted-foreground">Gender</p>
            <p className="text-right font-medium capitalize">{patient.gender ?? "—"}</p>
            <p className="text-muted-foreground">Blood type</p>
            <p className="text-right font-medium">{patient.blood_type ?? "—"}</p>
          </div>
          {patient.allergies?.length > 0 && (
            <div className="flex items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-2 text-xs font-medium text-destructive">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
              {patient.allergies.join(", ")}
            </div>
          )}
          {patient.notes && (
            <div>
              <p className="text-xs text-muted-foreground">Medical history</p>
              <p className="mt-0.5 text-xs">{patient.notes}</p>
            </div>
          )}
          <Link
            href={`/patients/${patient.id}?tab=timeline`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <History className="size-3.5" />
            View full history
          </Link>
        </Card>

        {/* Center: clinical documentation */}
        <Card className="p-5 shadow-sm lg:col-span-2">
          <Tabs defaultValue={initialTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="triage">Vitals &amp; triage</TabsTrigger>
              <TabsTrigger value="diagnosis">SOAP note</TabsTrigger>
              <TabsTrigger value="investigations">Investigations</TabsTrigger>
              <TabsTrigger value="procedures">Procedures</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="follow-up">Follow-up</TabsTrigger>
            </TabsList>

            <TabsContent value="triage" className="mt-4">
              <TriagePanel appointmentId={appointment.id} patientId={patient.id} triage={triage} />
            </TabsContent>
            <TabsContent value="diagnosis" className="mt-4">
              <DiagnosisPanel
                appointmentId={appointment.id}
                patientId={patient.id}
                record={record}
                canEdit={isDoctor}
              />
            </TabsContent>
            <TabsContent value="investigations" className="mt-4">
              <InvestigationsPanel
                appointmentId={appointment.id}
                patientId={patient.id}
                investigations={investigations}
                canOrder={isDoctor}
                canUpdate={isClinical}
              />
            </TabsContent>
            <TabsContent value="procedures" className="mt-4">
              <ProceduresPanel
                appointmentId={appointment.id}
                patientId={patient.id}
                procedureOrders={procedureOrders}
                canOrder={isDoctor}
                canUpdate={isClinical}
              />
            </TabsContent>
            <TabsContent value="prescriptions" className="mt-4">
              <PrescriptionsPanel
                appointmentId={appointment.id}
                patientId={patient.id}
                prescriptions={prescriptions}
                canPrescribe={isDoctor}
              />
            </TabsContent>
            <TabsContent value="follow-up" className="mt-4">
              <FollowUpPanel appointmentId={appointment.id} patientId={patient.id} canSchedule={isDoctor} />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Right: alerts */}
        <Card className="gap-3 p-4 shadow-sm lg:col-span-1 lg:self-start">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Alerts</p>
          {vitalFlags.length === 0 && (!patient.allergies || patient.allergies.length === 0) ? (
            <p className="text-xs text-muted-foreground">Nothing flagged for this visit.</p>
          ) : (
            <div className="space-y-2">
              {patient.allergies?.map((a) => (
                <div key={a} className="flex items-center gap-2 text-xs">
                  <ShieldAlert className="size-3.5 shrink-0 text-destructive" />
                  Allergy: {a}
                </div>
              ))}
              {vitalFlags.map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-xs">
                  <AlertTriangle
                    className={`size-3.5 shrink-0 ${f.severity === "critical" ? "text-destructive" : "text-warning"}`}
                  />
                  <StatusBadge label={f.label} tone={f.severity === "critical" ? "destructive" : "warning"} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
