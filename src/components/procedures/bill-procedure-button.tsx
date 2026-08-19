"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { billProcedureOrder } from "@/actions/procedures";

export function BillProcedureButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function bill() {
    startTransition(async () => {
      const result = await billProcedureOrder(orderId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Invoice created");
      if (result.id) router.push(`/billing/${result.id}`);
      else router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={bill}>
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Receipt className="size-3.5" />}
      Bill
    </Button>
  );
}
