import { subDays, format as formatDate, eachDayOfInterval } from "date-fns";
import {
  DollarSign,
  Users,
  CalendarClock,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { appointmentStatus } from "@/lib/status";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const toDate = to ? new Date(`${to}T23:59:59`) : new Date();
  const fromDate = from ? new Date(`${from}T00:00:00`) : subDays(toDate, 29);
  const fromStr = formatDate(fromDate, "yyyy-MM-dd");
  const toStr = formatDate(toDate, "yyyy-MM-dd");

  const supabase = await createClient();

  const [
    { data: payments },
    { data: appointments },
    { count: newPatients },
    { data: openInvoices },
    { count: overdueInvoices },
    { data: dispenses },
    { data: completedProcedures },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select("amount, paid_at, is_refund")
      .gte("paid_at", fromDate.toISOString())
      .lte("paid_at", toDate.toISOString()),
    supabase
      .from("appointments")
      .select("id, status, patient_id")
      .gte("scheduled_at", fromDate.toISOString())
      .lte("scheduled_at", toDate.toISOString()),
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true })
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString()),
    supabase.from("invoices").select("total").in("status", ["issued", "partially_paid"]),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["issued", "partially_paid"])
      .lt("due_date", formatDate(new Date(), "yyyy-MM-dd")),
    supabase
      .from("dispenses")
      .select("quantity_dispensed, prescription_items(medication_name), dispensed_at")
      .gte("dispensed_at", fromDate.toISOString())
      .lte("dispensed_at", toDate.toISOString()),
    supabase
      .from("procedure_orders")
      .select("procedure_name, price")
      .eq("status", "completed")
      .gte("performed_at", fromDate.toISOString())
      .lte("performed_at", toDate.toISOString()),
  ]);

  const netRevenue = (payments ?? []).reduce(
    (sum, p) => sum + (p.is_refund ? -Number(p.amount) : Number(p.amount)),
    0
  );
  const totalVisits = appointments?.length ?? 0;
  const distinctPatientsVisited = new Set((appointments ?? []).map((a) => a.patient_id)).size;
  const outstandingTotal = (openInvoices ?? []).reduce((sum, i) => sum + Number(i.total), 0);

  const kpis = [
    { label: "Revenue", value: formatCurrency(netRevenue), icon: DollarSign, tone: "success" as const },
    { label: "Visits", value: totalVisits, icon: CalendarClock },
    { label: "Unique patients seen", value: distinctPatientsVisited, icon: Users },
    { label: "New patients", value: newPatients ?? 0, icon: TrendingUp },
    {
      label: "Outstanding",
      value: formatCurrency(outstandingTotal),
      icon: Receipt,
      tone: outstandingTotal > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      label: "Overdue invoices",
      value: overdueInvoices ?? 0,
      icon: Receipt,
      tone: (overdueInvoices ?? 0) > 0 ? ("destructive" as const) : ("default" as const),
    },
  ];

  // --- Revenue chart across the selected range ---
  const days = eachDayOfInterval({ start: fromDate, end: toDate });
  const dayBuckets = new Map<string, number>();
  for (const d of days) dayBuckets.set(formatDate(d, "yyyy-MM-dd"), 0);
  for (const p of payments ?? []) {
    const key = formatDate(new Date(p.paid_at), "yyyy-MM-dd");
    if (dayBuckets.has(key)) {
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + (p.is_refund ? -Number(p.amount) : Number(p.amount)));
    }
  }
  const revenuePoints = Array.from(dayBuckets.entries()).map(([date, amount]) => ({
    date,
    label: formatDate(new Date(date), "MMM d"),
    amount,
  }));

  // --- Appointment status breakdown ---
  const statusCounts = new Map<string, number>();
  for (const a of appointments ?? []) {
    statusCounts.set(a.status, (statusCounts.get(a.status) ?? 0) + 1);
  }
  const statusRows = Array.from(statusCounts.entries()).sort((a, b) => b[1] - a[1]);
  const maxStatusCount = Math.max(1, ...statusRows.map(([, c]) => c));

  // --- Top medications (by quantity dispensed) ---
  const medCounts = new Map<string, number>();
  for (const d of dispenses ?? []) {
    const item = Array.isArray(d.prescription_items) ? d.prescription_items[0] : d.prescription_items;
    const name = item?.medication_name ?? "Unknown";
    medCounts.set(name, (medCounts.get(name) ?? 0) + d.quantity_dispensed);
  }
  const topMedications = Array.from(medCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // --- Top procedures (by revenue) ---
  const procRevenue = new Map<string, number>();
  for (const p of completedProcedures ?? []) {
    procRevenue.set(p.procedure_name, (procRevenue.get(p.procedure_name) ?? 0) + Number(p.price));
  }
  const topProcedures = Array.from(procRevenue.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Clinic-wide analytics for the selected date range."
        actions={
          <form className="flex items-end gap-2" method="get">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <input
                type="date"
                name="from"
                defaultValue={fromStr}
                className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <input
                type="date"
                name="to"
                defaultValue={toStr}
                className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
              />
            </div>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </form>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} tone={kpi.tone} />
        ))}
      </div>

      <RevenueChart points={revenuePoints} title={`Revenue — ${fromStr} to ${toStr}`} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="gap-4 p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Appointments by status</h2>
          {statusRows.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No appointments in range" />
          ) : (
            <div className="space-y-3">
              {statusRows.map(([status, count]) => {
                const meta = appointmentStatus[status] ?? appointmentStatus.scheduled;
                const pct = Math.max(4, Math.round((count / maxStatusCount) * 100));
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs text-muted-foreground">{meta.label}</span>
                    <div className="h-5 flex-1 overflow-hidden rounded-md bg-muted/60">
                      <div
                        className="flex h-full items-center justify-end rounded-md bg-primary px-2"
                        style={{ width: `${pct}%` }}
                      >
                        <span className="text-[11px] font-semibold text-primary-foreground tabular-nums">
                          {count}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="gap-3 p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Top medications dispensed</h2>
          {topMedications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dispenses in range.</p>
          ) : (
            <ul className="space-y-2">
              {topMedications.map(([name, qty]) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="truncate">{name}</span>
                  <span className="font-medium tabular-nums">{qty}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="gap-3 p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Top procedures by revenue</h2>
          {topProcedures.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed procedures in range.</p>
          ) : (
            <ul className="space-y-2">
              {topProcedures.map(([name, revenue]) => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="truncate">{name}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
