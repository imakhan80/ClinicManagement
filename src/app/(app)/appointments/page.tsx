import { CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { AppointmentActions } from "@/components/appointments/appointment-actions";
import { AppointmentCalendar } from "@/components/appointments/appointment-calendar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDateTime, initials } from "@/lib/format";
import { appointmentStatus } from "@/lib/status";

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, status, reason, patient_id, patients(full_name), doctor:profiles!doctor_id(full_name)"
    )
    .gte("scheduled_at", startOfToday.toISOString())
    .not("status", "in", "(completed,cancelled,no_show)")
    .order("scheduled_at", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Upcoming visits across the clinic."
        actions={<NewAppointmentDialog />}
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {!appointments || appointments.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No upcoming appointments"
              description="Book a new appointment to fill the schedule."
            />
          ) : (
            <Card className="gap-0 overflow-hidden p-0 shadow-sm">
              <ul className="divide-y divide-border">
                {appointments.map((appt) => {
                  const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
                  const doctor = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor;
                  const meta = appointmentStatus[appt.status] ?? appointmentStatus.scheduled;
                  return (
                    <li
                      key={appt.id}
                      className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="size-9 shrink-0">
                          <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                            {initials(patient?.full_name ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{patient?.full_name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatDateTime(appt.scheduled_at)}
                            {doctor?.full_name ? ` · Dr. ${doctor.full_name}` : ""}
                            {appt.reason ? ` · ${appt.reason}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge label={meta.label} tone={meta.tone} />
                        <AppointmentActions
                          appointmentId={appt.id}
                          patientId={appt.patient_id}
                          status={appt.status}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <AppointmentCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
