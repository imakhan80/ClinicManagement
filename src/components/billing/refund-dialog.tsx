"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Undo2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { recordRefund } from "@/actions/billing";
import type { PaymentMethod } from "@/lib/types/database";

interface FormValues {
  amount: number;
  method: PaymentMethod;
  note: string;
}

export function RefundDialog({ invoiceId, paidAmount }: { invoiceId: string; paidAmount: number }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { amount: paidAmount, method: "cash", note: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await recordRefund(invoiceId, values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Undo2 className="size-3.5" />
            Refund
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Issue refund</DialogTitle>
          <DialogDescription>Paid so far: ${paidAmount.toFixed(2)}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" step="0.01" {...register("amount", { valueAsNumber: true, required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={watch("method")} onValueChange={(v) => setValue("method", v as PaymentMethod)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Input placeholder="Overcharged, service not rendered…" {...register("note")} />
          </div>
          {serverError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{serverError}</p>
          )}
          <Button type="submit" className="w-full" variant="outline" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Issue refund
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
