import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { ConsultationWorkspace } from "@/components/consultation/consultation-workspace";
import { calculateAge, formatDateTime } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*, patients(*)")
    .eq("id", appointmentId)
    .single();

  if (!appointment) notFound();
  const patient = Array.isArray(appointment.patients)
    ? appointment.patients[0]
    : appointment.patients;
  if (!patient) notFound();

  const [
    { data: queueEntry },
    { data: triage },
    { data: record },
    { data: investigations },
    { data: prescriptions },
    { data: procedureOrders },
  ] = await Promise.all([
    supabase
      .from("queue_entries")
      .select("id, status")
      .eq("appointment_id", appointmentId)
      .maybeSingle(),
    supabase
      .from("triage_records")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("medical_records").select("*").eq("appointment_id", appointmentId).maybeSingle(),
    supabase
      .from("investigations")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("ordered_at", { ascending: false }),
    supabase
      .from("prescriptions")
      .select("*, prescription_items(*)")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("procedure_orders")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("ordered_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/queue"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to queue
      </Link>

      <div className="flex items-center gap-4">
        <Avatar className="size-12 shrink-0">
          <AvatarFallback className="bg-accent text-accent-foreground">
            {initials(patient.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{patient.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {patient.mrn} · {calculateAge(patient.date_of_birth)} yrs · {formatDateTime(appointment.scheduled_at)}
          </p>
        </div>
      </div>

      <ConsultationWorkspace
        appointment={appointment}
        patient={patient}
        queueEntry={queueEntry ?? null}
        triage={triage ?? null}
        record={record ?? null}
        investigations={investigations ?? []}
        prescriptions={prescriptions ?? []}
        procedureOrders={procedureOrders ?? []}
        currentUserRole={user!.role}
      />
    </div>
  );
}
