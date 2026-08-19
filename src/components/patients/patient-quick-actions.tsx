"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, Pill, FlaskConical, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { NewInvoiceDialog } from "@/components/billing/new-invoice-dialog";
import { checkInAppointment } from "@/actions/appointments";
import type { AppointmentStatus, Role } from "@/lib/types/database";

interface TodaysAppointment {
  id: string;
  status: AppointmentStatus;
}

export function PatientQuickActions({
  patientId,
  todaysAppointment,
  role,
}: {
  patientId: string;
  todaysAppointment: TodaysAppointment | null;
  role: Role;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canBill = role === "admin" || role === "receptionist";
  const canConsult = role === "doctor" || role === "admin";

  function goToConsult(tab?: string) {
    if (!todaysAppointment) return;
    startTransition(async () => {
      if (todaysAppointment.status === "scheduled") {
        await checkInAppointment(todaysAppointment.id, patientId);
      }
      router.push(`/consultation/${todaysAppointment.id}${tab ? `?tab=${tab}` : ""}`);
    });
  }

  const consultDisabled = !todaysAppointment || !canConsult;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <NewAppointmentDialog patientId={patientId} />
      {canConsult && (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={consultDisabled || isPending}
            title={!todaysAppointment ? "No appointment today" : undefined}
            onClick={() => goToConsult()}
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Stethoscope className="size-3.5" />}
            Start consultation
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={consultDisabled || isPending}
            title={!todaysAppointment ? "No appointment today" : undefined}
            onClick={() => goToConsult("prescriptions")}
          >
            <Pill className="size-3.5" />
            Add prescription
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={consultDisabled || isPending}
            title={!todaysAppointment ? "No appointment today" : undefined}
            onClick={() => goToConsult("investigations")}
          >
            <FlaskConical className="size-3.5" />
            Order lab
          </Button>
        </>
      )}
      {canBill && <NewInvoiceDialog patientId={patientId} />}
      <Button variant="outline" size="sm" disabled title="Messaging is not available yet">
        <MessageSquare className="size-3.5" />
        Send message
      </Button>
    </div>
  );
}
