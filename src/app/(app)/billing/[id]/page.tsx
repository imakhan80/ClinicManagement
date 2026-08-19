import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { StatusBadge } from "@/components/status-badge";
import { RecordPaymentDialog } from "@/components/billing/record-payment-dialog";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { invoiceStatus } from "@/lib/status";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, patients(full_name, mrn)")
    .eq("id", id)
    .single();
  if (!invoice) notFound();

  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from("invoice_items").select("*").eq("invoice_id", id),
    supabase.from("payments").select("*").eq("invoice_id", id).order("paid_at", { ascending: false }),
  ]);

  const patient = Array.isArray(invoice.patients) ? invoice.patients[0] : invoice.patients;
  const meta = invoiceStatus[invoice.status] ?? invoiceStatus.draft;
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Math.max(0, Number(invoice.total) - totalPaid);
  const canRecordPayment =
    (user?.role === "admin" || user?.role === "receptionist") && balance > 0 && invoice.status !== "void";

  return (
    <div className="space-y-6">
      <Link
        href="/billing"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All invoices
      </Link>

      <Card className="gap-5 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{invoice.invoice_number}</h1>
            <p className="text-sm text-muted-foreground">
              {patient?.full_name} · {patient?.mrn} · {formatDate(invoice.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge label={meta.label} tone={meta.tone} />
            {canRecordPayment && <RecordPaymentDialog invoiceId={invoice.id} balance={balance} />}
          </div>
        </div>

        <div className="rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 font-medium">Qty</th>
                <th className="px-4 py-2.5 font-medium">Unit price</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">{item.description}</td>
                  <td className="px-4 py-2.5 tabular-nums">{item.quantity}</td>
                  <td className="px-4 py-2.5 tabular-nums">{formatCurrency(Number(item.unit_price))}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatCurrency(Number(item.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(Number(invoice.subtotal))}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span className="tabular-nums">{formatCurrency(Number(invoice.tax))}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(Number(invoice.total))}</span>
          </div>
          <div className="flex justify-between text-success">
            <span>Paid</span>
            <span className="tabular-nums">{formatCurrency(totalPaid)}</span>
          </div>
          {balance > 0 && (
            <div className="flex justify-between font-semibold text-destructive">
              <span>Balance due</span>
              <span className="tabular-nums">{formatCurrency(balance)}</span>
            </div>
          )}
        </div>
      </Card>

      {payments && payments.length > 0 && (
        <Card className="gap-0 overflow-hidden p-0 shadow-sm">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold">Payment history</h2>
          </div>
          <ul className="divide-y divide-border">
            {payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm capitalize">{payment.method.replace("_", " ")}</span>
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums">
                    {formatCurrency(Number(payment.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(payment.paid_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
