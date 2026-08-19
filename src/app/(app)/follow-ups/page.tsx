import { CalendarCheck2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { ScheduleFollowUpDialog } from "@/components/follow-ups/schedule-follow-up-dialog";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { followUpStatus } from "@/lib/status";

export default async function FollowUpsPage() {
  const supabase = await createClient();

  const { data: followUps } = await supabase
    .from("follow_ups")
    .select(
      "id, recommended_date, reason, status, doctor_id, patients(id, full_name), doctor:profiles!doctor_id(full_name)"
    )
    .order("recommended_date", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-ups"
        description="Recommended return visits awaiting scheduling."
      />

      {!followUps || followUps.length === 0 ? (
        <EmptyState icon={CalendarCheck2} title="No follow-ups recommended" />
      ) : (
        <Card className="gap-0 overflow-hidden p-0 shadow-sm">
          <ul className="divide-y divide-border">
            {followUps.map((fu) => {
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
                    {fu.status === "pending" && patient && (
                      <ScheduleFollowUpDialog
                        followUpId={fu.id}
                        patientId={patient.id}
                        doctorId={fu.doctor_id}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
