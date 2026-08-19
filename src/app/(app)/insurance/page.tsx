import { ShieldCheck, FileClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { NewProviderDialog } from "@/components/insurance/new-provider-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { insuranceClaimStatus } from "@/lib/status";

export default async function InsurancePage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: providers }, { data: claims }] = await Promise.all([
    supabase.from("insurance_providers").select("*").order("name"),
    supabase
      .from("insurance_claims")
      .select(
        "id, status, claimed_amount, approved_amount, submitted_at, invoices(invoice_number, patients(full_name))"
      )
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Insurance"
        description="Providers on file and claims filed against invoices."
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Providers</h2>
          {user?.role === "admin" && <NewProviderDialog />}
        </div>
        {!providers || providers.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No providers on file" />
        ) : (
          <Card className="gap-0 overflow-hidden p-0 shadow-sm">
            <ul className="divide-y divide-border">
              {providers.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[p.phone, p.email].filter(Boolean).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Recent claims</h2>
        {!claims || claims.length === 0 ? (
          <EmptyState icon={FileClock} title="No claims filed yet" />
        ) : (
          <Card className="gap-0 overflow-hidden p-0 shadow-sm">
            <ul className="divide-y divide-border">
              {claims.map((claim) => {
                const invoice = Array.isArray(claim.invoices) ? claim.invoices[0] : claim.invoices;
                const patient = invoice
                  ? Array.isArray(invoice.patients)
                    ? invoice.patients[0]
                    : invoice.patients
                  : null;
                const meta = insuranceClaimStatus[claim.status] ?? insuranceClaimStatus.draft;
                return (
                  <li key={claim.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{patient?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice?.invoice_number}
                        {claim.submitted_at ? ` · ${formatDate(claim.submitted_at)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(Number(claim.approved_amount ?? claim.claimed_amount))}
                      </span>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
