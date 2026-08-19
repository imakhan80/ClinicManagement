import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatRelative } from "@/lib/format";
import { queueStatus } from "@/lib/status";

interface QueueRow {
  id: string;
  queue_number: number;
  status: string;
  checked_in_at: string;
  patientName: string;
  doctorName: string | null;
}

export function QueueSnapshot({ rows }: { rows: QueueRow[] }) {
  return (
    <Card className="gap-0 overflow-hidden p-0 shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">Live queue</h2>
        <Link href="/queue" className="text-xs font-medium text-primary hover:underline">
          Open board
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={ListOrdered} title="No one waiting" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-5 py-2 font-medium">Token</th>
                <th className="px-2 py-2 font-medium">Patient</th>
                <th className="hidden px-2 py-2 font-medium sm:table-cell">Doctor</th>
                <th className="px-2 py-2 font-medium">Waiting</th>
                <th className="px-5 py-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = queueStatus[row.status] ?? queueStatus.waiting;
                return (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-5 py-2.5 font-medium tabular-nums">{row.queue_number}</td>
                    <td className="px-2 py-2.5">{row.patientName}</td>
                    <td className="hidden px-2 py-2.5 text-muted-foreground sm:table-cell">
                      {row.doctorName ? `Dr. ${row.doctorName}` : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground">
                      {formatRelative(row.checked_in_at)}
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
  );
}
