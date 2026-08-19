import Link from "next/link";
import { CalendarClock, Users, ListOrdered, Receipt, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatTime, initials } from "@/lib/format";
import { appointmentStatus } from "@/lib/status";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    { data: todaysAppointments },
    { count: waitingCount },
    { count: patientCount },
    { data: openInvoices },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, scheduled_at, status, reason, patients(full_name), doctor:profiles!doctor_id(full_name)"
      )
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("queue_entries")
      .select("id", { count: "exact", head: true })
      .in("status", ["waiting", "triaged", "ready", "in_consult"]),
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase.from("invoices").select("total").in("status", ["issued", "partially_paid"]),
  ]);

  const outstandingTotal = (openInvoices ?? []).reduce((sum, i) => sum + Number(i.total), 0);

  const stats = [
    {
      label: "Today's appointments",
      value: todaysAppointments?.length ?? 0,
      icon: CalendarClock,
      href: "/appointments",
    },
    {
      label: "Patients in queue",
      value: waitingCount ?? 0,
      icon: ListOrdered,
      href: "/queue",
    },
    {
      label: "Total patients",
      value: patientCount ?? 0,
      icon: Users,
      href: "/patients",
    },
    {
      label: "Outstanding balance",
      value: formatCurrency(outstandingTotal),
      icon: Receipt,
      href: "/billing",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Good day, ${user?.fullName.split(" ")[0] ?? ""}`}
        description="Here's what's happening across the clinic today."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="group h-full gap-2 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <stat.icon className="size-[18px]" strokeWidth={2} />
                </div>
                <ArrowRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Today&apos;s schedule</h2>
          <Link
            href="/appointments"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {!todaysAppointments || todaysAppointments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarClock}
              title="No appointments today"
              description="Book an appointment to see it appear on the schedule."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {todaysAppointments.map((appt) => {
              const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
              const doctor = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor;
              const meta = appointmentStatus[appt.status] ?? appointmentStatus.scheduled;
              return (
                <li
                  key={appt.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <span className="w-16 shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
                    {formatTime(appt.scheduled_at)}
                  </span>
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                      {initials(patient?.full_name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{patient?.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {appt.reason || "General visit"}
                      {doctor?.full_name ? ` · Dr. ${doctor.full_name}` : ""}
                    </p>
                  </div>
                  <StatusBadge label={meta.label} tone={meta.tone} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
