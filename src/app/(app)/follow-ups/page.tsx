import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { ScheduleFollowUpDialog } from "@/components/follow-ups/schedule-follow-up-dialog";
import { CancelFollowUpButton } from "@/components/follow-ups/cancel-follow-up-button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { followUpStatus } from "@/lib/status";

export default async function FollowUpsPage() {
  const supabase = await createClient();

  const { data: followUps } = await supabase
    .from("follow_ups")
    .select(
      "id, recommended_date, reason, status, doctor_id, scheduled_appointment_id, patients(id, full_name), doctor:profiles!doctor_id(full_name)"
    )
    .order("recommended_date", { ascending: true });

  const active = (followUps ?? []).filter((f) => f.status === "pending" || f.status === "scheduled");
  const history = (followUps ?? []).filter((f) => f.status === "completed" || f.status === "cancelled");

  function renderList(items: typeof active) {
    if (items.length === 0) return <EmptyState icon={CalendarCheck2} title="Nothing here" />;
    return (
      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <ul className="divide-y divide-border">
          {items.map((fu) => {
            const patient = Array.isArray(fu.patients) ? fu.patients[0] : fu.patients;
            const doctor = Array.isArray(fu.doctor) ? fu.doctor[0] : fu.doctor;
            const meta = followUpStatus[fu.status] ?? followUpStatus.pending;
            return (
              <li
                key={fu.id}
                className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{patient?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Recommended {formatDate(fu.recommended_date)}
                    {doctor?.full_name ? ` · Dr. ${doctor.full_name}` : ""}
                    {fu.reason ? ` · ${fu.reason}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={meta.label} tone={meta.tone} />
                  {fu.status === "scheduled" && fu.scheduled_appointment_id && (
                    <Link
                      href={`/consultation/${fu.scheduled_appointment_id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View appointment
                    </Link>
                  )}
                  {fu.status === "pending" && patient && (
                    <>
                      <ScheduleFollowUpDialog followUpId={fu.id} patientId={patient.id} doctorId={fu.doctor_id} />
                      <CancelFollowUpButton followUpId={fu.id} />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Follow-ups" description="Recommended return visits and their scheduling status." />

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {renderList(active)}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          {renderList(history)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
