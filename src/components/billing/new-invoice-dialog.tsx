"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InvoiceForm } from "@/components/billing/invoice-form";

export function NewInvoiceDialog({ patientId }: { patientId?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // useSearchParams() reads empty during the initial (pre-hydration) render, so a
  // lazy useState initializer can't see "?new=1" — this must open post-hydration,
  // in an effect. handledNewParam makes it fire at most once, since otherwise a
  // changing searchParams/router identity across renders re-runs the effect
  // and cascades into repeated setState calls (React flags this — intentional here).
  const handledNewParam = useRef(false);

  useEffect(() => {
    if (handledNewParam.current) return;
    if (!patientId && searchParams.get("new") === "1") {
      handledNewParam.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing open state to a one-time URL signal, guarded to run once
      setOpen(true);
      router.replace("/billing");
    }
  }, [patientId, searchParams, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Receipt className="size-4" />
            New invoice
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>Bill a patient for services rendered.</DialogDescription>
        </DialogHeader>
        <InvoiceForm
          patientId={patientId}
          onSuccess={(id) => {
            setOpen(false);
            router.push(`/billing/${id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
