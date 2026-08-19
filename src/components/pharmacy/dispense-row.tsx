"use client";

import { useState, useTransition } from "react";
import { Loader2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const remaining = quantity - quantityDispensed;
  const [amount, setAmount] = useState(remaining);
  const [dispensedSoFar, setDispensedSoFar] = useState(quantityDispensed);
  const [error, setError] = useState<string | null>(null);

  const stillRemaining = quantity - dispensedSoFar;
  const done = stillRemaining <= 0;

  return (
    <div className="rounded-lg border border-border px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{medicationName}</p>
          <p className="text-xs text-muted-foreground">
            {dosage ? `${dosage} · ` : ""}
            {dispensedSoFar}/{quantity} dispensed
          </p>
        </div>
        {done ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-success">
            <PackageCheck className="size-3.5" /> Dispensed
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              max={stillRemaining}
              value={amount}
              onChange={(e) => setAmount(Math.min(stillRemaining, Math.max(1, Number(e.target.value))))}
              className="h-8 w-16 text-center"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await dispenseItem({ prescriptionItemId: itemId, quantity: amount });
                  if (result.error) {
                    setError(result.error);
                    return;
                  }
                  setDispensedSoFar((prev) => prev + amount);
                })
              }
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              Dispense
            </Button>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
