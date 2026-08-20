"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Stethoscope, Loader2, CalendarCog, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checkInAppointment, updateAppointmentStatus } from "@/actions/appointments";
import { RescheduleAppointmentDialog } from "@/components/appointments/reschedule-appointment-dialog";
import type { AppointmentStatus } from "@/lib/types/database";

export function AppointmentActions({
  appointmentId,
  patientId,
  status,
  scheduledAt,
  durationMinutes,
  doctorId,
  reason,
  notes,
}: {
  appointmentId: string;
  patientId: string;
  status: AppointmentStatus;
  scheduledAt: string;
  durationMinutes: number;
  doctorId: string | null;
  reason: string | null;
  notes: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  function cancelAppointment() {
    if (!window.confirm("Cancel this appointment?")) return;
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointmentId, "cancelled");
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Appointment cancelled");
      router.refresh();
    });
  }

  if (status === "scheduled") {
    return (
      <>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await checkInAppointment(appointmentId, patientId);
                router.refresh();
              })
            }
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <LogIn className="size-3.5" />}
            Check in
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={isPending}
            aria-label="Reschedule"
            onClick={() => setRescheduleOpen(true)}
          >
            <CalendarCog className="size-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={isPending}
            aria-label="Cancel appointment"
            onClick={cancelAppointment}
          >
            <X className="size-3.5" />
          </Button>
        </div>
        <RescheduleAppointmentDialog
          appointmentId={appointmentId}
          scheduledAt={scheduledAt}
          durationMinutes={durationMinutes}
          doctorId={doctorId}
          reason={reason}
          notes={notes}
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
        />
      </>
    );
  }

  if (status === "checked_in" || status === "in_progress") {
    return (
      <Button
        size="sm"
        variant="outline"
        nativeButton={false}
        render={
          <Link href={`/consultation/${appointmentId}`}>
            <Stethoscope className="size-3.5" />
            Open consult
          </Link>
        }
      />
    );
  }

  return null;
}
