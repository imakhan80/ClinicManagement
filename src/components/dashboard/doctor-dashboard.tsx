import Link from "next/link";
import { addHours, formatISO } from "date-fns";
import {
  Users,
  ListOrdered,
  CheckCircle2,
  CalendarCheck2,
  CalendarClock,
  FlaskConical,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatTime, initials } from "@/lib/format";
import { appointmentStatus, queueStatus } from "@/lib/status";

export async function DoctorDashboard({ user }: { user: CurrentUser }) {
  const supabase = await createClient();

  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const nextHour = addHours(now, 1);
  const todayDateStr = formatISO(now, { representation: "date" });

  const [
    { data: myAppointmentsToday },
    { data: myQueueToday },
    { count: overdueFollowUps },
    { count: dueTodayFollowUps },
    { count: pendingInvestigations },
    { count: pendingProcedures },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, scheduled_at, status, reason, patient_id, patients(full_name)")
      .eq("doctor_id", user.id)
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("queue_entries")
      .select(
        "id, queue_number, status, checked_in_at, appointment_id, patients(full_name), appointments!inner(doctor_id)"
      )
      .eq("appointments.doctor_id", user.id)
      .gte("checked_in_at", startOfDay.toISOString())
      .in("status", ["waiting", "triaged", "ready", "in_consult"])
      .order("queue_number", { ascending: true }),
    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", user.id)
      .eq("status", "pending")
      .lt("recommended_date", todayDateStr),
    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", user.id)
      .eq("status", "pending")
      .eq("recommended_date", todayDateStr),
    supabase
      .from("investigations")
      .select("id", { count: "exact", head: true })
      .eq("ordered_by", user.id)
      .in("status", ["ordered", "in_progress"]),
    supabase
      .from("procedure_orders")
      .select("id", { count: "exact", head: true })
      .eq("ordered_by", user.id)
      .eq("status", "ordered"),
  ]);

  const appointments = myAppointmentsToday ?? [];
  const queueRows = (myQueueToday ?? []).map((q) => {
    const patient = Array.isArray(q.patients) ? q.patients[0] : q.patients;
    return {
      id: q.id,
      queue_number: q.queue_number,
      status: q.status,
      checked_in_at: q.checked_in_at,
      appointment_id: q.appointment_id,
      patientName: patient?.full_name ?? "Unknown",
    };
  });

  const distinctPatientsToday = new Set(appointments.map((a) => a.patient_id)).size;
  const waitingForMe = queueRows.filter((q) => q.status === "ready" || q.status === "in_consult").length;
  const completedToday = appointments.filter((a) => a.status === "completed").length;
  const followUpsDue = (overdueFollowUps ?? 0) + (dueTodayFollowUps ?? 0);

  const kpis = [
    { label: "My patients today", value: distinctPatientsToday, icon: Users, href: "/appointments" },
    { label: "Waiting for me", value: waitingForMe, icon: ListOrdered, href: "/queue" },
    { label: "Completed today", value: completedToday, icon: CheckCircle2, href: "/appointments" },
    { label: "Follow-ups due", value: followUpsDue, icon: CalendarCheck2, href: "/follow-ups" },
  ];

  const upcomingHourCount = appointments.filter(
    (a) => a.status === "scheduled" && new Date(a.scheduled_at) >= now && new Date(a.scheduled_at) <= nextHour
  ).length;

  const alerts = [
    {
      label: "overdue follow-ups",
      count: overdueFollowUps ?? 0,
      icon: CalendarCheck2,
      tone: "destructive" as const,
      href: "/follow-ups",
    },
    {
      label: "appointments in the next hour",
      count: upcomingHourCount,
      icon: CalendarClock,
      tone: "warning" as const,
      href: "/appointments",
    },
    {
      label: "of my lab/imaging orders pending",
      count: pendingInvestigations ?? 0,
      icon: FlaskConical,
      tone: "warning" as const,
      href: "/laboratory",
    },
    {
      label: "of my procedures not yet performed",
      count: pendingProcedures ?? 0,
      icon: ClipboardList,
      tone: "warning" as const,
      href: "/procedures",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Good day, Dr. ${user.fullName.split(" ")[0] ?? ""}`}
        description="Here's your day — who's waiting, and what needs follow-up."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <KpiCard label={kpi.label} value={kpi.value} icon={kpi.icon} />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="gap-0 overflow-hidden p-0 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Up next</h2>
            <Link href="/queue" className="text-xs font-medium text-primary hover:underline">
              Open queue
            </Link>
          </div>
          {queueRows.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Stethoscope} title="No one waiting for you right now" />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {queueRows.map((row) => {
                const meta = queueStatus[row.status] ?? queueStatus.waiting;
                return (
                  <li key={row.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                      {row.queue_number}
                    </span>
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback className="bg-accent text-[11px] text-accent-foreground">
                        {initials(row.patientName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-sm font-medium">{row.patientName}</span>
                    <StatusBadge label={meta.label} tone={meta.tone} />
                    <Button
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={`/consultation/${row.appointment_id}`}>Start</Link>}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <AlertsPanel alerts={alerts} />
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">My schedule — today</h2>
          <Link href="/appointments" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {appointments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarClock}
              title="No appointments today"
              description="Appointments assigned to you will show up here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Time</th>
                  <th className="px-2 py-2 font-medium">Patient</th>
                  <th className="hidden px-2 py-2 font-medium md:table-cell">Reason</th>
                  <th className="px-5 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => {
                  const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
                  const meta = appointmentStatus[appt.status] ?? appointmentStatus.scheduled;
                  return (
                    <tr key={appt.id} className="border-t border-border hover:bg-muted/40">
                      <td className="px-5 py-2.5 font-medium tabular-nums text-muted-foreground">
                        {formatTime(appt.scheduled_at)}
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7 shrink-0">
                            <AvatarFallback className="bg-accent text-[11px] text-accent-foreground">
                              {initials(patient?.full_name ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate font-medium">{patient?.full_name}</span>
                        </div>
                      </td>
                      <td className="hidden px-2 py-2.5 text-muted-foreground md:table-cell">
                        {appt.reason || "General visit"}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
