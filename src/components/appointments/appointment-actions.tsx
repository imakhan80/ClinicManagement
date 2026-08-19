"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Stethoscope, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkInAppointment } from "@/actions/appointments";
import type { AppointmentStatus } from "@/lib/types/database";

export function AppointmentActions({
  appointmentId,
  patientId,
  status,
}: {
  appointmentId: string;
  patientId: string;
  status: AppointmentStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (status === "scheduled") {
    return (
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
