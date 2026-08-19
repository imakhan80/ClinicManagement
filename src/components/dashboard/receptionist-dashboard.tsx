import Link from "next/link";
import { addHours, formatISO } from "date-fns";
import {
  CalendarClock,
  ListOrdered,
  DollarSign,
  Receipt,
  UserPlus,
  CalendarCheck2,
  ShieldCheck,
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
import { formatCurrency, formatTime, initials } from "@/lib/format";
import { appointmentStatus, invoiceStatus } from "@/lib/status";

export async function ReceptionistDashboard({ user }: { user: CurrentUser }) {
  const supabase = await createClient();

  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const nextHour = addHours(now, 1);
  const todayDateStr = formatISO(now, { representation: "date" });

  const [
    { data: todaysAppointments },
    { count: checkedInToday },
    { data: recentPayments },
    { data: openInvoices },
    { data: overdueInvoiceRows },
    { count: claimsAwaitingDecision },
    { count: unbilledProcedures },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, scheduled_at, status, reason, patient_id, patients(full_name), doctor:profiles!doctor_id(full_name)"
      )
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("queue_entries")
      .select("id", { count: "exact", head: true })
      .gte("checked_in_at", startOfDay.toISOString()),
    supabase
      .from("payments")
      .select("amount, paid_at")
      .gte("paid_at", startOfDay.toISOString()),
    supabase.from("invoices").select("total").in("status", ["issued", "partially_paid"]),
    supabase
      .from("invoices")
      .select("id, total, due_date, status, patients(full_name)")
      .in("status", ["issued", "partially_paid"])
      .lt("due_date", todayDateStr)
      .order("due_date", { ascending: true })
      .limit(8),
    supabase
      .from("insurance_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("procedure_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .is("invoice_id", null),
  ]);

  const appointments = todaysAppointments ?? [];
  const revenueToday = (recentPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const outstandingTotal = (openInvoices ?? []).reduce((sum, i) => sum + Number(i.total), 0);
  const overdueInvoices = overdueInvoiceRows ?? [];

  const kpis = [
    { label: "Today's appointments", value: appointments.length, icon: CalendarClock, href: "/appointments" },
    { label: "Checked in today", value: checkedInToday ?? 0, icon: ListOrdered, href: "/queue" },
    {
      label: "Revenue today",
      value: formatCurrency(revenueToday),
      icon: DollarSign,
      href: "/billing",
      tone: "success" as const,
    },
    {
      label: "Outstanding",
      value: formatCurrency(outstandingTotal),
      icon: Receipt,
      href: "/billing",
      tone: outstandingTotal > 0 ? ("warning" as const) : ("default" as const),
    },
  ];

  const upcomingHourCount = appointments.filter(
    (a) => a.status === "scheduled" && new Date(a.scheduled_at) >= now && new Date(a.scheduled_at) <= nextHour
  ).length;
  const noShowsToday = appointments.filter((a) => a.status === "no_show").length;

  const alerts = [
    {
      label: "overdue invoices",
      count: overdueInvoices.length,
      icon: Receipt,
      tone: "destructive" as const,
      href: "/billing",
    },
    {
      label: "appointments in the next hour",
      count: upcomingHourCount,
      icon: CalendarClock,
      tone: "warning" as const,
      href: "/appointments",
    },
    {
      label: "no-shows today",
      count: noShowsToday,
      icon: CalendarCheck2,
      tone: "warning" as const,
      href: "/appointments",
    },
    {
      label: "insurance claims awaiting decision",
      count: claimsAwaitingDecision ?? 0,
      icon: ShieldCheck,
      tone: "warning" as const,
      href: "/insurance",
    },
    {
      label: "completed procedures awaiting billing",
      count: unbilledProcedures ?? 0,
      icon: ClipboardList,
      tone: "warning" as const,
      href: "/billing",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Good day, ${user.fullName.split(" ")[0] ?? ""}`}
        description="Today's front desk — schedule, check-ins, and billing."
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/patients">
            <UserPlus className="size-4" />
            New patient
          </Link>} />
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <KpiCard label={kpi.label} value={kpi.value} icon={kpi.icon} tone={kpi.tone} />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="gap-0 overflow-hidden p-0 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Today&apos;s schedule</h2>
            <Link href="/appointments" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {appointments.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={CalendarClock}
                title="No appointments today"
                description="Book an appointment to see it appear on the schedule."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-5 py-2 font-medium">Time</th>
                    <th className="px-2 py-2 font-medium">Patient</th>
                    <th className="hidden px-2 py-2 font-medium sm:table-cell">Doctor</th>
                    <th className="px-5 py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => {
                    const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
                    const doctor = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor;
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
                        <td className="hidden px-2 py-2.5 text-muted-foreground sm:table-cell">
                          {doctor?.full_name ? `Dr. ${doctor.full_name}` : "—"}
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
        <AlertsPanel alerts={alerts} />
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Overdue invoices</h2>
          <Link href="/billing" className="text-xs font-medium text-primary hover:underline">
            Open billing
          </Link>
        </div>
        {overdueInvoices.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={Receipt} title="Nothing overdue" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Patient</th>
                  <th className="px-2 py-2 font-medium">Due date</th>
                  <th className="px-2 py-2 font-medium">Amount</th>
                  <th className="px-5 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {overdueInvoices.map((inv) => {
                  const patient = Array.isArray(inv.patients) ? inv.patients[0] : inv.patients;
                  const meta = invoiceStatus[inv.status] ?? invoiceStatus.issued;
                  return (
                    <tr key={inv.id} className="border-t border-border hover:bg-muted/40">
                      <td className="px-5 py-2.5 font-medium">{patient?.full_name ?? "Unknown"}</td>
                      <td className="px-2 py-2.5 text-muted-foreground">{inv.due_date}</td>
                      <td className="px-2 py-2.5 font-medium tabular-nums">
                        {formatCurrency(Number(inv.total))}
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
