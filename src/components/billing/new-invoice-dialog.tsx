"use client";

import { useEffect, useState } from "react";
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

export function NewInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setOpen(true);
      router.replace("/billing");
    }
  }, [searchParams, router]);

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
          onSuccess={(id) => {
            setOpen(false);
            router.push(`/billing/${id}`);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
