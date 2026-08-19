"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TriagePanel } from "@/components/consultation/triage-panel";
import { DiagnosisPanel } from "@/components/consultation/diagnosis-panel";
import { InvestigationsPanel } from "@/components/consultation/investigations-panel";
import { PrescriptionsPanel } from "@/components/consultation/prescriptions-panel";
import { FollowUpPanel } from "@/components/consultation/follow-up-panel";
import { completeQueueEntry } from "@/actions/queue";
import type { Database, Role } from "@/lib/types/database";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Patient = Database["public"]["Tables"]["patients"]["Row"];
type Triage = Database["public"]["Tables"]["triage_records"]["Row"];
type MedicalRecord = Database["public"]["Tables"]["medical_records"]["Row"];
type Investigation = Database["public"]["Tables"]["investigations"]["Row"];
type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"] & {
  prescription_items: Database["public"]["Tables"]["prescription_items"]["Row"][];
};

export function ConsultationWorkspace({
  appointment,
  patient,
  queueEntry,
  triage,
  record,
  investigations,
  prescriptions,
  currentUserRole,
}: {
  appointment: Appointment;
  patient: Patient;
  queueEntry: { id: string; status: string } | null;
  triage: Triage | null;
  record: MedicalRecord | null;
  investigations: Investigation[];
  prescriptions: Prescription[];
  currentUserRole: Role;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isDoctor = currentUserRole === "doctor";
  const isClinical = currentUserRole === "doctor" || currentUserRole === "nurse" || currentUserRole === "admin";
  const canComplete = appointment.status !== "completed" && (isDoctor || currentUserRole === "admin");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {patient.allergies?.length > 0 && (
            <span className="font-medium text-destructive">
              Allergies: {patient.allergies.join(", ")}
            </span>
          )}
        </p>
        {canComplete && queueEntry && (
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
        )}
      </div>

      <Card className="p-5 shadow-sm">
        <Tabs defaultValue="triage">
          <TabsList>
            <TabsTrigger value="triage">Vitals &amp; triage</TabsTrigger>
            <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
            <TabsTrigger value="investigations">Investigations</TabsTrigger>
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
    </div>
  );
}
