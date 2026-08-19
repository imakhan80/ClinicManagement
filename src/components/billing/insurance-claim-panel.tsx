"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { fileClaim, decideClaim } from "@/actions/insurance";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import { insuranceClaimStatus } from "@/lib/status";
import type { Database } from "@/lib/types/database";

type Claim = Database["public"]["Tables"]["insurance_claims"]["Row"];

export function InsuranceClaimPanel({
  invoiceId,
  patientId,
  balance,
  claim,
  canManage,
}: {
  invoiceId: string;
  patientId: string;
  balance: number;
  claim: Claim | null;
  canManage: boolean;
}) {
  if (!claim) {
    return <NewClaimCard invoiceId={invoiceId} patientId={patientId} balance={balance} canManage={canManage} />;
  }
  return <ExistingClaimCard claim={claim} canManage={canManage} />;
}

function NewClaimCard({
  invoiceId,
  patientId,
  balance,
  canManage,
}: {
  invoiceId: string;
  patientId: string;
  balance: number;
  canManage: boolean;
}) {
  const [policies, setPolicies] = useState<{ id: string; label: string }[]>([]);
  const [policyId, setPolicyId] = useState("");
  const [amount, setAmount] = useState(balance);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    createClient()
      .from("patient_insurance_policies")
      .select("id, policy_number, insurance_providers(name)")
      .eq("patient_id", patientId)
      .then(({ data }) =>
        setPolicies(
          (data ?? []).map((p) => {
            const provider = Array.isArray(p.insurance_providers) ? p.insurance_providers[0] : p.insurance_providers;
            return { id: p.id, label: `${provider?.name ?? "Unknown"} · ${p.policy_number}` };
          })
        )
      );
  }, [patientId]);

  if (policies.length === 0) return null;

  function submit() {
    if (!policyId) return;
    startTransition(async () => {
      const result = await fileClaim({ invoice_id: invoiceId, policy_id: policyId, claimed_amount: amount });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Claim filed");
      router.refresh();
    });
  }

  return (
    <Card className="gap-3 p-5 shadow-sm print:hidden">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <ShieldCheck className="size-4" />
        Insurance claim
      </h2>
      {canManage ? (
        <div className="space-y-2.5">
          <div className="space-y-1.5">
            <Label>Policy</Label>
            <Select value={policyId} onValueChange={(v) => setPolicyId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a policy" />
              </SelectTrigger>
              <SelectContent>
                {policies.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Claimed amount</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </div>
          <Button size="sm" className="w-full" disabled={!policyId || isPending} onClick={submit}>
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            File claim
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          This patient has an insurance policy on file — admin/front desk can file a claim.
        </p>
      )}
    </Card>
  );
}

function ExistingClaimCard({ claim, canManage }: { claim: Claim; canManage: boolean }) {
  const [approvedAmount, setApprovedAmount] = useState(Number(claim.claimed_amount));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const meta = insuranceClaimStatus[claim.status] ?? insuranceClaimStatus.draft;

  function decide(status: "approved" | "rejected" | "paid") {
    startTransition(async () => {
      const result = await decideClaim({
        claim_id: claim.id,
        status,
        approved_amount: status === "rejected" ? undefined : approvedAmount,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Claim ${status}`);
      router.refresh();
    });
  }

  return (
    <Card className="gap-3 p-5 shadow-sm print:hidden">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <ShieldCheck className="size-4" />
          Insurance claim
        </h2>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </div>
      <p className="text-sm">
        Claimed <span className="font-medium tabular-nums">{formatCurrency(Number(claim.claimed_amount))}</span>
        {claim.approved_amount != null && (
          <>
            {" "}
            · Approved{" "}
            <span className="font-medium tabular-nums">{formatCurrency(Number(claim.approved_amount))}</span>
          </>
        )}
      </p>
      {canManage && claim.status === "submitted" && (
        <div className="space-y-2.5 border-t border-border pt-3">
          <div className="space-y-1.5">
            <Label>Approved amount</Label>
            <Input
              type="number"
              step="0.01"
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={isPending} onClick={() => decide("approved")}>
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Approve
            </Button>
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => decide("paid")}>
              Mark paid
            </Button>
            <Button size="sm" variant="ghost" disabled={isPending} onClick={() => decide("rejected")}>
              Reject
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
