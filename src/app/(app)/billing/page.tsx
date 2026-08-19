import Link from "next/link";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { NewInvoiceDialog } from "@/components/billing/new-invoice-dialog";
import { BillProcedureButton } from "@/components/procedures/bill-procedure-button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { invoiceStatus } from "@/lib/status";

export default async function BillingPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const canCreate = user?.role === "admin" || user?.role === "receptionist";

  const [{ data: invoices }, { data: unbilledProcedures }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total, created_at, patients(full_name)")
      .order("created_at", { ascending: false }),
    canCreate
      ? supabase
          .from("procedure_orders")
          .select("id, procedure_name, price, performed_at, patients(full_name)")
          .eq("status", "completed")
          .is("invoice_id", null)
          .order("performed_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Invoices and payments across the clinic."
        actions={canCreate ? <NewInvoiceDialog /> : undefined}
      />

      {canCreate && unbilledProcedures && unbilledProcedures.length > 0 && (
        <Card className="gap-0 overflow-hidden p-0 shadow-sm">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold">Unbilled completed procedures</h2>
          </div>
          <ul className="divide-y divide-border">
            {unbilledProcedures.map((order) => {
              const patient = Array.isArray(order.patients) ? order.patients[0] : order.patients;
              return (
                <li key={order.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback className="bg-accent text-[11px] text-accent-foreground">
                        {initials(patient?.full_name ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{order.procedure_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient?.full_name} · {formatCurrency(Number(order.price))}
                      </p>
                    </div>
                  </div>
                  <BillProcedureButton orderId={order.id} />
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {!invoices || invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" />
      ) : (
        <Card className="gap-0 overflow-hidden p-0 shadow-sm">
          <ul className="divide-y divide-border">
            {invoices.map((invoice) => {
              const patient = Array.isArray(invoice.patients) ? invoice.patients[0] : invoice.patients;
              const meta = invoiceStatus[invoice.status] ?? invoiceStatus.draft;
              return (
                <li key={invoice.id}>
                  <Link
                    href={`/billing/${invoice.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient?.full_name} · {formatDate(invoice.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(Number(invoice.total))}
                      </span>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
