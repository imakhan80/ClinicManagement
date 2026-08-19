"use client";

import { useEffect, useState, useTransition } from "react";
import { ClipboardList, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { orderProcedure, completeProcedureOrder, cancelProcedureOrder } from "@/actions/procedures";
import { createClient } from "@/lib/supabase/client";
import { procedureOrderStatus } from "@/lib/status";
import { formatCurrency } from "@/lib/format";
import type { Database } from "@/lib/types/database";

type ProcedureOrder = Database["public"]["Tables"]["procedure_orders"]["Row"];

export function ProceduresPanel({
  appointmentId,
  patientId,
  procedureOrders,
  canOrder,
  canUpdate,
}: {
  appointmentId: string;
  patientId: string;
  procedureOrders: ProcedureOrder[];
  canOrder: boolean;
  canUpdate: boolean;
}) {
  const [catalog, setCatalog] = useState<{ id: string; label: string; price: number }[]>([]);
  const [selected, setSelected] = useState("");
  const [isOrdering, startOrdering] = useTransition();

  useEffect(() => {
    if (!canOrder) return;
    createClient()
      .from("procedure_catalog")
      .select("id, name, default_price")
      .order("name")
      .then(({ data }) =>
        setCatalog((data ?? []).map((p) => ({ id: p.id, label: p.name, price: Number(p.default_price) })))
      );
  }, [canOrder]);

  function handleOrder() {
    if (!selected) return;
    startOrdering(async () => {
      await orderProcedure({ patientId, appointmentId, procedureId: selected });
      setSelected("");
    });
  }

  return (
    <div className="space-y-4">
      {procedureOrders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No procedures ordered" />
      ) : (
        <div className="space-y-2.5">
          {procedureOrders.map((order) => (
            <ProcedureOrderRow key={order.id} order={order} canUpdate={canUpdate} />
          ))}
        </div>
      )}

      {canOrder && (
        <div className="flex items-end gap-2 border-t border-border pt-4">
          <div className="flex-1 space-y-1.5">
            <Select value={selected} onValueChange={(v) => setSelected(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a procedure…" />
              </SelectTrigger>
              <SelectContent>
                {catalog.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label} — {formatCurrency(p.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" disabled={!selected || isOrdering} onClick={handleOrder}>
            {isOrdering ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Order
          </Button>
        </div>
      )}
    </div>
  );
}

function ProcedureOrderRow({ order, canUpdate }: { order: ProcedureOrder; canUpdate: boolean }) {
  const [isPending, startTransition] = useTransition();
  const meta = procedureOrderStatus[order.status] ?? procedureOrderStatus.ordered;

  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{order.procedure_name}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(Number(order.price))}</p>
        </div>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </div>
      {canUpdate && order.status === "ordered" && (
        <div className="mt-2.5 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => startTransition(async () => { await completeProcedureOrder(order.id); })}
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Mark performed
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => startTransition(async () => { await cancelProcedureOrder(order.id); })}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
