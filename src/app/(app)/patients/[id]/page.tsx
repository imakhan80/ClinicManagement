import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  CalendarClock,
  FileText,
  Receipt,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { EditPatientSheet } from "@/components/patients/edit-patient-sheet";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  calculateAge,
  formatCurrency,
  formatDate,
  formatDateTime,
  initials,
} from "@/lib/format";
import { appointmentStatus, invoiceStatus } from "@/lib/status";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).single();
  if (!patient) notFound();

  const [{ data: appointments }, { data: records }, { data: invoices }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, scheduled_at, status, reason, doctor:profiles!doctor_id(full_name)")
      .eq("patient_id", id)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("medical_records")
      .select("id, diagnosis, prescription, created_at, doctor:profiles!doctor_id(full_name)")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total, created_at")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All patients
      </Link>

      <Card className="gap-4 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="size-14 shrink-0">
              <AvatarFallback className="bg-accent text-base text-accent-foreground">
                {initials(patient.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{patient.full_name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {patient.mrn} · {calculateAge(patient.date_of_birth)} yrs
                {patient.gender ? ` · ${patient.gender}` : ""}
                {patient.blood_type ? ` · ${patient.blood_type}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {patient.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" /> {patient.phone}
                  </span>
                )}
                {patient.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {patient.email}
                  </span>
                )}
                {patient.address && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {patient.address}
                  </span>
                )}
              </div>
              {patient.allergies?.length > 0 && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                  <ShieldAlert className="size-3.5" />
                  Allergies: {patient.allergies.join(", ")}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <EditPatientSheet patient={patient} />
            <NewAppointmentDialog patientId={patient.id} />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="records">Medical records</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-4">
          {!appointments || appointments.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No appointments yet" />
          ) : (
            <Card className="gap-0 overflow-hidden p-0 shadow-sm">
              <ul className="divide-y divide-border">
                {appointments.map((appt) => {
                  const doctor = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor;
                  const meta = appointmentStatus[appt.status] ?? appointmentStatus.scheduled;
                  return (
                    <li
                      key={appt.id}
                      className="flex items-center justify-between gap-4 px-5 py-3.5"
                    >
                      <div>
                        <p className="text-sm font-medium">{formatDateTime(appt.scheduled_at)}</p>
                        <p className="text-xs text-muted-foreground">
                          {appt.reason || "General visit"}
                          {doctor?.full_name ? ` · Dr. ${doctor.full_name}` : ""}
                        </p>
                      </div>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          {!records || records.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No medical records"
              description="Records are only visible to the treating doctor, nurses, and admins."
            />
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const doctor = Array.isArray(record.doctor) ? record.doctor[0] : record.doctor;
                return (
                  <Card key={record.id} className="gap-2 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        Dr. {doctor?.full_name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(record.created_at)}
                      </p>
                    </div>
                    {record.diagnosis && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Diagnosis: </span>
                        {record.diagnosis}
                      </p>
                    )}
                    {record.prescription && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Notes: </span>
                        {record.prescription}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing" className="mt-4">
          {!invoices || invoices.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices yet" />
          ) : (
            <Card className="gap-0 overflow-hidden p-0 shadow-sm">
              <ul className="divide-y divide-border">
                {invoices.map((invoice) => {
                  const meta = invoiceStatus[invoice.status] ?? invoiceStatus.draft;
                  return (
                    <li key={invoice.id}>
                      <Link
                        href={`/billing/${invoice.id}`}
                        className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/40"
                      >
                        <div>
                          <p className="text-sm font-medium">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(invoice.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium tabular-nums">
                            {formatCurrency(Number(invoice.total))}
                          </span>
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
