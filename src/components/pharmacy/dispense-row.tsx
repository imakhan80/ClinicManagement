"use client";

import { useState, useTransition } from "react";
import { Loader2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dispenseItem } from "@/actions/pharmacy";

export function DispenseRow({
  itemId,
  medicationName,
  dosage,
  quantity,
  quantityDispensed,
}: {
  itemId: string;
  medicationName: string;
  dosage: string | null;
  quantity: number;
  quantityDispensed: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(quantityDispensed >= quantity);
  const remaining = quantity - quantityDispensed;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5">
      <div>
        <p className="text-sm font-medium">{medicationName}</p>
        <p className="text-xs text-muted-foreground">
          {dosage ? `${dosage} · ` : ""}
          {quantityDispensed}/{quantity} dispensed
        </p>
      </div>
      {done ? (
        <span className="flex items-center gap-1.5 text-xs font-medium text-success">
          <PackageCheck className="size-3.5" /> Dispensed
        </span>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await dispenseItem({ prescriptionItemId: itemId, quantity: remaining });
              setDone(true);
            })
          }
        >
          {isPending && <Loader2 className="size-3.5 animate-spin" />}
          Dispense {remaining}
        </Button>
      )}
    </div>
  );
}
