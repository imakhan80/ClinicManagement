"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { FlaskConical, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { addInvestigation, updateInvestigationResult } from "@/actions/consultation";
import { investigationStatus } from "@/lib/status";
import type { Database } from "@/lib/types/database";

type Investigation = Database["public"]["Tables"]["investigations"]["Row"];

interface FormValues {
  testName: string;
}

const QUICK_TESTS: Record<"lab" | "imaging" | "other", string[]> = {
  lab: ["CBC", "Blood Glucose", "Lipid Profile", "LFTs", "KFTs", "Urinalysis", "Thyroid Panel", "HbA1c"],
  imaging: ["X-Ray Chest", "Ultrasound Abdomen", "CT Scan", "MRI", "ECG"],
  other: [],
};

export function InvestigationsPanel({
  appointmentId,
  patientId,
  investigations,
  canOrder,
  canUpdate,
}: {
  appointmentId: string;
  patientId: string;
  investigations: Investigation[];
  canOrder: boolean;
  canUpdate: boolean;
}) {
  const [category, setCategory] = useState<"lab" | "imaging" | "other">("lab");
  const [quickOrdering, setQuickOrdering] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { testName: "" },
  });

  async function onSubmit(values: FormValues) {
    await addInvestigation({ appointmentId, patientId, category, testName: values.testName });
    reset({ testName: "" });
  }

  async function quickOrder(testName: string) {
    setQuickOrdering(testName);
    await addInvestigation({ appointmentId, patientId, category, testName });
    setQuickOrdering(null);
  }

  return (
    <div className="space-y-4">
      {investigations.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No investigations ordered" />
      ) : (
        <div className="space-y-2.5">
          {investigations.map((inv) => (
            <InvestigationRow key={inv.id} investigation={inv} appointmentId={appointmentId} canUpdate={canUpdate} />
          ))}
        </div>
      )}

      {canOrder && (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="w-28">
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lab">Lab</SelectItem>
                <SelectItem value="imaging">Imaging</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {QUICK_TESTS[category].length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TESTS[category].map((test) => (
                <button
                  key={test}
                  type="button"
                  disabled={quickOrdering !== null}
                  onClick={() => quickOrder(test)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {quickOrdering === test ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                  {test}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-2">
            <Input placeholder="Other test name…" className="flex-1" {...register("testName", { required: true })} />
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              Order
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function InvestigationRow({
  investigation,
  appointmentId,
  canUpdate,
}: {
  investigation: Investigation;
  appointmentId: string;
  canUpdate: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [resultText, setResultText] = useState(investigation.result_text ?? "");
  const meta = investigationStatus[investigation.status] ?? investigationStatus.ordered;

  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium capitalize">
            {investigation.category} · {investigation.test_name}
          </p>
        </div>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </div>
      {canUpdate && investigation.status !== "completed" && investigation.status !== "cancelled" && (
        <div className="mt-2.5 space-y-2">
          <Textarea
            rows={2}
            placeholder="Result…"
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  updateInvestigationResult({
                    id: investigation.id,
                    appointmentId,
                    status: "completed",
                    resultText,
                  });
                })
              }
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Mark completed
            </Button>
          </div>
        </div>
      )}
      {investigation.result_text && investigation.status === "completed" && (
        <p className="mt-2 text-sm text-muted-foreground">{investigation.result_text}</p>
      )}
    </div>
  );
}
