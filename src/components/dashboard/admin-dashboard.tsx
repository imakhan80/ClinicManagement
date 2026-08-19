import Link from "next/link";
import { subDays, addHours, format as formatDate, formatISO } from "date-fns";
import {
  CalendarClock,
  Users,
  ListOrdered,
  Receipt,
  FlaskConical,
  Pill,
  DollarSign,
  CalendarCheck2,
  PackageX,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PatientFlow } from "@/components/dashboard/patient-flow";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { QueueSnapshot } from "@/components/dashboard/queue-snapshot";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatTime, initials } from "@/lib/format";
import { appointmentStatus } from "@/lib/status";

export async function AdminDashboard({ user }: { user: CurrentUser }) {
  const supabase = await createClient();

  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const nextHour = addHours(now, 1);
  const fourteenDaysAgo = subDays(startOfDay, 13);
  const todayDateStr = formatISO(now, { representation: "date" });

  const [
    { data: todaysAppointments },
    { data: queueToday },
    { data: recentPayments },
    { data: openInvoices },
    { count: labOrdersToday },
    { data: dispensesToday },
    { data: investigationsToday },
    { data: prescriptionsToday },
    { count: invoicesToday },
    { count: overdueFollowUps },
    { data: allMedications },
    { count: pendingLabResults },
    { count: overdueInvoices },
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
      .select("id, queue_number, status, checked_in_at, appointment_id, patients(full_name)")
      .gte("checked_in_at", startOfDay.toISOString())
      .order("queue_number", { ascending: true }),
    supabase
      .from("payments")
      .select("amount, paid_at")
      .gte("paid_at", fourteenDaysAgo.toISOString()),
    supabase.from("invoices").select("total").in("status", ["issued", "partially_paid"]),
    supabase
      .from("investigations")
      .select("id", { count: "exact", head: true })
      .eq("category", "lab")
      .gte("ordered_at", startOfDay.toISOString()),
    supabase
      .from("dispenses")
      .select("quantity_dispensed, medications(unit_price)")
      .gte("dispensed_at", startOfDay.toISOString()),
    supabase
      .from("investigations")
      .select("patient_id")
      .gte("ordered_at", startOfDay.toISOString()),
    supabase
      .from("prescriptions")
      .select("patient_id")
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("recommended_date", todayDateStr),
    supabase.from("medications").select("id, stock_quantity, reorder_level"),
    supabase
      .from("investigations")
      .select("id", { count: "exact", head: true })
      .in("status", ["ordered", "in_progress"]),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["issued", "partially_paid"])
      .lt("due_date", todayDateStr),
  ]);

  const [{ data: allInventoryItems }, { count: claimsAwaitingDecision }] = await Promise.all([
    supabase.from("inventory_items").select("id, stock_quantity, reorder_level"),
    supabase.from("insurance_claims").select("id", { count: "exact", head: true }).eq("status", "submitted"),
  ]);

  // --- Doctor lookup for queue rows (via today's appointments) ---
  const doctorByAppointment = new Map<string, string | null>();
  for (const appt of todaysAppointments ?? []) {
    const doctor = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor;
    doctorByAppointment.set(appt.id, doctor?.full_name ?? null);
  }

  const queueRows = (queueToday ?? []).map((q) => {
    const patient = Array.isArray(q.patients) ? q.patients[0] : q.patients;
    return {
      id: q.id,
      queue_number: q.queue_number,
      status: q.status,
      checked_in_at: q.checked_in_at,
      patientName: patient?.full_name ?? "Unknown",
      doctorName: doctorByAppointment.get(q.appointment_id) ?? null,
    };
  });

  // --- KPIs ---
  const distinctPatientsToday = new Set((todaysAppointments ?? []).map((a) => a.patient_id)).size;
  const revenueToday = (recentPayments ?? [])
    .filter((p) => new Date(p.paid_at) >= startOfDay)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const outstandingTotal = (openInvoices ?? []).reduce((sum, i) => sum + Number(i.total), 0);
  const pharmacySalesToday = (dispensesToday ?? []).reduce((sum, d) => {
    const med = Array.isArray(d.medications) ? d.medications[0] : d.medications;
    return sum + d.quantity_dispensed * Number(med?.unit_price ?? 0);
  }, 0);
  const waitingCount = queueRows.filter((q) => q.status === "waiting").length;
  const lowStockCount = (allMedications ?? []).filter(
    (m) => m.stock_quantity <= m.reorder_level
  ).length;
  const lowStockInventoryCount = (allInventoryItems ?? []).filter(
    (i) => i.stock_quantity <= i.reorder_level
  ).length;

  const kpis = [
    { label: "Today's patients", value: distinctPatientsToday, icon: Users, href: "/patients" },
    {
      label: "Appointments",
      value: todaysAppointments?.length ?? 0,
      icon: CalendarClock,
      href: "/appointments",
    },
    { label: "Waiting patients", value: waitingCount, icon: ListOrdered, href: "/queue" },
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
    { label: "Lab orders today", value: labOrdersToday ?? 0, icon: FlaskConical, href: "/queue" },
    {
      label: "Pharmacy sales today",
      value: formatCurrency(pharmacySalesToday),
      icon: Pill,
      href: "/pharmacy",
    },
  ];

  // --- Patient flow ---
  const flowStages = [
    { label: "Registration", count: todaysAppointments?.length ?? 0 },
    { label: "Check-in", count: queueRows.length },
    { label: "Waiting", count: waitingCount },
    {
      label: "Consultation",
      count: queueRows.filter((q) => q.status === "in_consult" || q.status === "completed").length,
    },
    {
      label: "Investigation",
      count: new Set((investigationsToday ?? []).map((i) => i.patient_id)).size,
    },
    {
      label: "Pharmacy",
      count: new Set((prescriptionsToday ?? []).map((p) => p.patient_id)).size,
    },
    { label: "Billing", count: invoicesToday ?? 0 },
  ];

  // --- Revenue chart (14 days) ---
  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = subDays(startOfDay, 13 - i);
    dayBuckets.set(formatDate(d, "yyyy-MM-dd"), 0);
  }
  for (const payment of recentPayments ?? []) {
    const key = formatDate(new Date(payment.paid_at), "yyyy-MM-dd");
    if (dayBuckets.has(key)) {
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + Number(payment.amount));
    }
  }
  const revenuePoints = Array.from(dayBuckets.entries()).map(([date, amount]) => ({
    date,
    label: formatDate(new Date(date), "MMM d"),
    amount,
  }));

  // --- Alerts ---
  const upcomingHourCount = (todaysAppointments ?? []).filter(
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
      label: "medications low on stock",
      count: lowStockCount,
      icon: PackageX,
      tone: "destructive" as const,
      href: "/pharmacy",
    },
    {
      label: "supply items low on stock",
      count: lowStockInventoryCount,
      icon: PackageX,
      tone: "destructive" as const,
      href: "/inventory",
    },
    {
      label: "lab results pending",
      count: pendingLabResults ?? 0,
      icon: FlaskConical,
      tone: "warning" as const,
      href: "/queue",
    },
    {
      label: "overdue invoices",
      count: overdueInvoices ?? 0,
      icon: Receipt,
      tone: "destructive" as const,
      href: "/billing",
    },
    {
      label: "insurance claims awaiting decision",
      count: claimsAwaitingDecision ?? 0,
      icon: ShieldCheck,
      tone: "warning" as const,
      href: "/insurance",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Good day, ${user.fullName.split(" ")[0] ?? ""}`}
        description="Here's what's happening across the clinic today."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <KpiCard label={kpi.label} value={kpi.value} icon={kpi.icon} tone={kpi.tone} />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart points={revenuePoints} />
        </div>
        <AlertsPanel alerts={alerts} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PatientFlow stages={flowStages} />
        <QueueSnapshot rows={queueRows.slice(0, 8)} />
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Today&apos;s schedule</h2>
          <Link href="/appointments" className="text-xs font-medium text-primary hover:underline">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Time</th>
                  <th className="px-2 py-2 font-medium">Patient</th>
                  <th className="hidden px-2 py-2 font-medium sm:table-cell">Doctor</th>
                  <th className="hidden px-2 py-2 font-medium md:table-cell">Type</th>
                  <th className="px-5 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {todaysAppointments.map((appt) => {
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
