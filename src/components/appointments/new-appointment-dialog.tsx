"use client";

import { useState } from "react";
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
