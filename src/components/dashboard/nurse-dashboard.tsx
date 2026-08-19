import Link from "next/link";
import {
  ListOrdered,
  ClipboardList,
  Activity,
  PackageX,
  FlaskConical,
  HeartPulse,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { QueueSnapshot } from "@/components/dashboard/queue-snapshot";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/format";
import { investigationStatus } from "@/lib/status";

export async function NurseDashboard({ user }: { user: CurrentUser }) {
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    { data: queueToday },
    { count: triagedToday },
    { data: pendingInvestigations },
    { data: allMedications },
    { data: allInventoryItems },
    { count: pendingProcedures },
  ] = await Promise.all([
    supabase
      .from("queue_entries")
      .select("id, queue_number, status, checked_in_at, appointment_id, patients(full_name)")
      .gte("checked_in_at", startOfDay.toISOString())
      .order("queue_number", { ascending: true }),
    supabase
      .from("triage_records")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString()),
    supabase
      .from("investigations")
      .select("id, test_name, category, status, ordered_at, patients(full_name)")
      .in("status", ["ordered", "in_progress"])
      .order("ordered_at", { ascending: true })
      .limit(8),
    supabase.from("medications").select("id, stock_quantity, reorder_level"),
    supabase.from("inventory_items").select("id, stock_quantity, reorder_level"),
    supabase
      .from("procedure_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "ordered"),
  ]);

  const queueRows = (queueToday ?? []).map((q) => {
    const patient = Array.isArray(q.patients) ? q.patients[0] : q.patients;
    return {
      id: q.id,
      queue_number: q.queue_number,
      status: q.status,
      checked_in_at: q.checked_in_at,
      patientName: patient?.full_name ?? "Unknown",
      doctorName: null,
    };
  });

  const waitingForTriage = queueRows.filter((q) => q.status === "waiting").length;
  const lowStockCount = (allMedications ?? []).filter(
    (m) => m.stock_quantity <= m.reorder_level
  ).length;
  const lowStockInventoryCount = (allInventoryItems ?? []).filter(
    (i) => i.stock_quantity <= i.reorder_level
  ).length;

  const kpis = [
    { label: "Waiting for triage", value: waitingForTriage, icon: ListOrdered, href: "/queue" },
    { label: "In queue today", value: queueRows.length, icon: Activity, href: "/queue" },
    { label: "Triaged today", value: triagedToday ?? 0, icon: HeartPulse, href: "/queue" },
    {
      label: "Meds low on stock",
      value: lowStockCount,
      icon: PackageX,
      href: "/pharmacy",
      tone: lowStockCount > 0 ? ("warning" as const) : ("default" as const),
    },
  ];

  const alerts = [
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
      label: "lab/imaging results pending",
      count: pendingInvestigations?.length ?? 0,
      icon: FlaskConical,
      tone: "warning" as const,
      href: "/laboratory",
    },
    {
      label: "procedures awaiting completion",
      count: pendingProcedures ?? 0,
      icon: ClipboardList,
      tone: "warning" as const,
      href: "/procedures",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Good day, ${user.fullName.split(" ")[0] ?? ""}`}
        description="Here's today's queue and what's waiting on results."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <KpiCard label={kpi.label} value={kpi.value} icon={kpi.icon} tone={kpi.tone} />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QueueSnapshot rows={queueRows.slice(0, 8)} />
        </div>
        <AlertsPanel alerts={alerts} />
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Pending lab &amp; imaging</h2>
          <Link href="/laboratory" className="text-xs font-medium text-primary hover:underline">
            Open laboratory
          </Link>
        </div>
        {!pendingInvestigations || pendingInvestigations.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={ClipboardList} title="No pending orders" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Patient</th>
                  <th className="px-2 py-2 font-medium">Test</th>
                  <th className="hidden px-2 py-2 font-medium sm:table-cell">Ordered</th>
                  <th className="px-5 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvestigations.map((inv) => {
                  const patient = Array.isArray(inv.patients) ? inv.patients[0] : inv.patients;
                  const meta = investigationStatus[inv.status] ?? investigationStatus.ordered;
                  return (
                    <tr key={inv.id} className="border-t border-border hover:bg-muted/40">
                      <td className="px-5 py-2.5 font-medium">{patient?.full_name ?? "Unknown"}</td>
                      <td className="px-2 py-2.5 text-muted-foreground">
                        {inv.test_name}{" "}
                        <span className="text-xs capitalize">({inv.category})</span>
                      </td>
                      <td className="hidden px-2 py-2.5 text-muted-foreground sm:table-cell">
                        {formatRelative(inv.ordered_at)}
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
