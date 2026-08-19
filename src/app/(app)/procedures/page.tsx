import Link from "next/link";
import { ClipboardList, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NewProcedureDialog } from "@/components/procedures/new-procedure-dialog";
import { ProcedureOrderActions } from "@/components/procedures/procedure-order-actions";
import { formatCurrency, formatRelative, initials } from "@/lib/format";
import { procedureOrderStatus } from "@/lib/status";

export default async function ProceduresPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const canUpdate = user?.role === "admin" || user?.role === "doctor" || user?.role === "nurse";

  const [{ data: orders }, { data: catalog }] = await Promise.all([
    supabase
      .from("procedure_orders")
      .select("id, procedure_name, price, status, ordered_at, patients(full_name)")
      .in("status", ["ordered", "completed"])
      .order("ordered_at", { ascending: false })
      .limit(30),
    supabase.from("procedure_catalog").select("*").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Procedures"
        description="Procedures ordered during consultation, and the catalog doctors order from."
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold">Recent orders</h2>
        {!orders || orders.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No procedures ordered yet" />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const patient = Array.isArray(order.patients) ? order.patients[0] : order.patients;
              const meta = procedureOrderStatus[order.status] ?? procedureOrderStatus.ordered;
              return (
                <Card key={order.id} className="gap-3 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="bg-accent text-[11px] text-accent-foreground">
                          {initials(patient?.full_name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{order.procedure_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {patient?.full_name} · {formatCurrency(Number(order.price))} ·{" "}
                          {formatRelative(order.ordered_at)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge label={meta.label} tone={meta.tone} />
                  </div>
                  {canUpdate && order.status === "ordered" && (
                    <ProcedureOrderActions orderId={order.id} />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Procedure catalog</h2>
          {user?.role === "admin" && <NewProcedureDialog />}
        </div>
        {!catalog || catalog.length === 0 ? (
          <EmptyState icon={ListChecks} title="No procedure types defined" />
        ) : (
          <Card className="gap-0 overflow-hidden p-0 shadow-sm">
            <ul className="divide-y divide-border">
              {catalog.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[p.category, p.default_duration_minutes ? `${p.default_duration_minutes} min` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatCurrency(Number(p.default_price))}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Completed procedures are billed from{" "}
        <Link href="/billing" className="font-medium text-primary hover:underline">
          Billing
        </Link>
        .
      </p>
    </div>
  );
}
