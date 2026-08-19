"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/appointments/appointment-form";

export function NewAppointmentDialog({ patientId }: { patientId?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!patientId && searchParams.get("new") === "1") {
      setOpen(true);
      router.replace("/appointments");
    }
  }, [patientId, searchParams, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <CalendarPlus className="size-4" />
            New appointment
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>Book a visit and it will appear on the schedule.</DialogDescription>
        </DialogHeader>
        <AppointmentForm patientId={patientId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
