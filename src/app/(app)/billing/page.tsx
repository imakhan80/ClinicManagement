import Link from "next/link";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { NewInvoiceDialog } from "@/components/billing/new-invoice-dialog";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { invoiceStatus } from "@/lib/status";

export default async function BillingPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const canCreate = user?.role === "admin" || user?.role === "receptionist";

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, created_at, patients(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Invoices and payments across the clinic."
        actions={canCreate ? <NewInvoiceDialog /> : undefined}
      />

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
