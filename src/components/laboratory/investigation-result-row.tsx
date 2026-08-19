"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { updateInvestigationResult } from "@/actions/consultation";
import { investigationStatus } from "@/lib/status";
import { formatDateTime } from "@/lib/format";
import type { Database } from "@/lib/types/database";

type Investigation = Database["public"]["Tables"]["investigations"]["Row"] & {
  patientName: string;
  doctorName: string | null;
};

export function InvestigationResultRow({
  investigation,
  canUpdate,
}: {
  investigation: Investigation;
  canUpdate: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [resultText, setResultText] = useState(investigation.result_text ?? "");
  const [status, setStatus] = useState(investigation.status);
  const meta = investigationStatus[status] ?? investigationStatus.ordered;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{investigation.test_name}</p>
          <p className="text-xs text-muted-foreground">
            {investigation.patientName}
            {investigation.doctorName ? ` · Ordered by Dr. ${investigation.doctorName}` : ""} ·{" "}
            {formatDateTime(investigation.ordered_at)}
          </p>
        </div>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </div>

      {canUpdate && status !== "completed" && status !== "cancelled" && (
        <div className="mt-3 space-y-2">
          <Textarea
            rows={2}
            placeholder="Enter result…"
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
          />
          <div className="flex gap-2">
            {status === "ordered" && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await updateInvestigationResult({
                      id: investigation.id,
                      appointmentId: investigation.appointment_id ?? "",
                      status: "in_progress",
                    });
                    setStatus("in_progress");
                  })
                }
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <PlayCircle className="size-3.5" />}
                Start processing
              </Button>
            )}
            <Button
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await updateInvestigationResult({
                    id: investigation.id,
                    appointmentId: investigation.appointment_id ?? "",
                    status: "completed",
                    resultText,
                  });
                  setStatus("completed");
                })
              }
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              Complete with result
            </Button>
          </div>
        </div>
      )}
      {investigation.result_text && status === "completed" && (
        <p className="mt-2 text-sm text-muted-foreground">{investigation.result_text}</p>
      )}
    </div>
  );
}
