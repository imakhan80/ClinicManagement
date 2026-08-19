"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeProcedureOrder, cancelProcedureOrder } from "@/actions/procedures";

export function ProcedureOrderActions({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function complete() {
    startTransition(async () => {
      const result = await completeProcedureOrder(orderId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  function cancel() {
    startTransition(async () => {
      await cancelProcedureOrder(orderId);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={isPending} onClick={complete}>
        {isPending && <Loader2 className="size-3.5 animate-spin" />}
        Mark performed
      </Button>
      <Button size="sm" variant="ghost" disabled={isPending} onClick={cancel}>
        Cancel
      </Button>
    </div>
  );
}
