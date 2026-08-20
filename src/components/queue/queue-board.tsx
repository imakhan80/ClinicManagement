"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, Loader2, Radio, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { initials, formatTime } from "@/lib/format";
import { queueStatus } from "@/lib/status";
import { callToConsult } from "@/actions/queue";
import type { Role } from "@/lib/types/database";

interface QueueRow {
  id: string;
  appointment_id: string;
  queue_number: number;
  priority: string;
  status: string;
  checked_in_at: string;
  patients: { full_name: string } | { full_name: string }[] | null;
}

const COLUMNS: { key: string; label: string }[] = [
  { key: "waiting", label: "Waiting" },
  { key: "triaged", label: "Triaged" },
  { key: "ready", label: "Ready" },
  { key: "in_consult", label: "In consult" },
];

export function QueueBoard({ initial, role }: { initial: QueueRow[]; role: Role }) {
  const [rows, setRows] = useState(initial);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      const { data } = await supabase
        .from("queue_entries")
        .select("id, appointment_id, queue_number, priority, status, checked_in_at, patients(full_name)")
        .in("status", ["waiting", "triaged", "ready", "in_consult"])
        .order("queue_number", { ascending: true });
      if (data) setRows(data as unknown as QueueRow[]);
    }

    const channel = supabase
      .channel("queue-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_entries" }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ListOrdered}
        title="Queue is empty"
        description="Checked-in patients will appear here in real time."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = rows.filter((r) => r.status === col.key);
        return (
          <div key={col.key} className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {col.label}
              </h3>
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-2.5">
              {items.map((entry) => {
                const patient = Array.isArray(entry.patients) ? entry.patients[0] : entry.patients;
                const meta = queueStatus[entry.status] ?? queueStatus.waiting;
                return (
                  <Card key={entry.id} className="gap-2 p-3.5 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-semibold tabular-nums text-accent-foreground">
                        {entry.queue_number}
                      </span>
                      <Avatar className="size-7 shrink-0">
                        <AvatarFallback className="bg-muted text-[11px]">
                          {initials(patient?.full_name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{patient?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(entry.checked_in_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge label={meta.label} tone={meta.tone} />
                      {entry.priority === "urgent" && (
                        <StatusBadge label="Urgent" tone="destructive" />
                      )}
                    </div>
                    {(col.key === "waiting" || col.key === "triaged" || col.key === "ready") && (
                      <div className="mt-1 flex gap-1.5">
                        {(role === "doctor" || role === "nurse" || role === "admin") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            nativeButton={false}
                            render={
                              <Link href={`/consultation/${entry.appointment_id}`}>
                                <ClipboardList className="size-3.5" />
                                Open chart
                              </Link>
                            }
                          />
                        )}
                        {(role === "doctor" || role === "admin") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            disabled={isPending}
                            onClick={() =>
                              startTransition(async () => {
                                const result = await callToConsult(entry.id, entry.appointment_id);
                                if (result.error) toast.error(result.error);
                              })
                            }
                          >
                            {isPending ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <ArrowRight className="size-3.5" />
                            )}
                            Call in
                          </Button>
                        )}
                      </div>
                    )}
                    {col.key === "in_consult" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 w-full"
                        nativeButton={false}
                        render={<Link href={`/consultation/${entry.appointment_id}`}>Open consult</Link>}
                      />
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="col-span-full flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
        <Radio className="size-3 text-success" />
        Live
      </div>
    </div>
  );
}
