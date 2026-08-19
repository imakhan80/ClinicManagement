"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { voidInvoice } from "@/actions/billing";

export function VoidInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Void this invoice? This cannot be undone.")) return;
        startTransition(async () => {
          const result = await voidInvoice(invoiceId);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("Invoice voided");
          router.refresh();
        });
      }}
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
      Void
    </Button>
  );
}
