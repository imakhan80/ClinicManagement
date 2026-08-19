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
  Pill,
  FlaskConical,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { EditPatientSheet } from "@/components/patients/edit-patient-sheet";
import { PatientQuickActions } from "@/components/patients/patient-quick-actions";
import { PatientDocuments } from "@/components/patients/patient-documents";
import { ClinicalTimeline, type TimelineEvent } from "@/components/patients/clinical-timeline";
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
import {
  appointmentStatus,
  invoiceStatus,
  investigationStatus,
  prescriptionStatus,
} from "@/lib/status";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).single();
  if (!patient) notFound();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [
    { data: appointments },
    { data: records },
    { data: invoices },
    { data: prescriptions },
    { data: investigations },
    { data: todaysAppointmentRow },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, scheduled_at, status, reason, doctor:profiles!doctor_id(full_name)")
      .eq("patient_id", id)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("medical_records")
      .select("id, appointment_id, diagnosis, prescription, created_at, doctor:profiles!doctor_id(full_name)")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total, created_at")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("prescriptions")
      .select("id, appointment_id, status, notes, created_at, doctor:profiles!doctor_id(full_name), prescription_items(*)")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("investigations")
      .select("id, appointment_id, category, test_name, status, result_text, ordered_at")
      .eq("patient_id", id)
      .order("ordered_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, status")
      .eq("patient_id", id)
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const invoiceIds = (invoices ?? []).map((i) => i.id);
  const { data: payments } =
    invoiceIds.length > 0
      ? await supabase
          .from("payments")
          .select("id, invoice_id, amount, method, paid_at")
          .in("invoice_id", invoiceIds)
      : { data: [] };

  const invoiceById = new Map((invoices ?? []).map((i) => [i.id, i]));

  // --- Build unified clinical timeline ---
  const events: TimelineEvent[] = [];
  for (const appt of appointments ?? []) {
    const doctor = Array.isArray(appt.doctor) ? appt.doctor[0] : appt.doctor;
    const meta = appointmentStatus[appt.status] ?? appointmentStatus.scheduled;
    events.push({
      id: appt.id,
      type: "visit",
      date: appt.scheduled_at,
      title: `Visit · ${appt.reason || "General visit"}`,
      subtitle: `${meta.label}${doctor?.full_name ? ` · Dr. ${doctor.full_name}` : ""}`,
      href: `/consultation/${appt.id}`,
    });
  }
  for (const record of records ?? []) {
    if (!record.diagnosis) continue;
    const doctor = Array.isArray(record.doctor) ? record.doctor[0] : record.doctor;
    events.push({
      id: record.id,
      type: "diagnosis",
      date: record.created_at,
      title: `Diagnosis: ${record.diagnosis}`,
      subtitle: doctor?.full_name ? `Dr. ${doctor.full_name}` : undefined,
      href: record.appointment_id ? `/consultation/${record.appointment_id}` : undefined,
    });
  }
  for (const rx of prescriptions ?? []) {
    const doctor = Array.isArray(rx.doctor) ? rx.doctor[0] : rx.doctor;
    const meds = rx.prescription_items.map((i) => i.medication_name).join(", ");
    events.push({
      id: rx.id,
      type: "prescription",
      date: rx.created_at,
      title: `Prescription: ${meds || "—"}`,
      subtitle: `${prescriptionStatus[rx.status]?.label ?? rx.status}${doctor?.full_name ? ` · Dr. ${doctor.full_name}` : ""}`,
      href: rx.appointment_id ? `/consultation/${rx.appointment_id}?tab=prescriptions` : undefined,
    });
  }
  for (const inv of investigations ?? []) {
    events.push({
      id: inv.id,
      type: "investigation",
      date: inv.ordered_at,
      title: `${inv.category === "lab" ? "Lab" : inv.category === "imaging" ? "Imaging" : "Investigation"}: ${inv.test_name}`,
      subtitle: investigationStatus[inv.status]?.label ?? inv.status,
      href: inv.appointment_id ? `/consultation/${inv.appointment_id}?tab=investigations` : undefined,
    });
  }
  for (const payment of payments ?? []) {
    const invoice = invoiceById.get(payment.invoice_id);
    events.push({
      id: payment.id,
      type: "payment",
      date: payment.paid_at,
      title: `Payment received — ${formatCurrency(Number(payment.amount))}`,
      subtitle: `${payment.method.replace("_", " ")}${invoice ? ` · ${invoice.invoice_number}` : ""}`,
      href: `/billing/${payment.invoice_id}`,
    });
  }

  const todaysAppointment = todaysAppointmentRow
    ? { id: todaysAppointmentRow.id, status: todaysAppointmentRow.status }
    : null;

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
          <EditPatientSheet patient={patient} />
        </div>

        <div className="border-t border-border pt-4">
          <PatientQuickActions
            patientId={patient.id}
            todaysAppointment={todaysAppointment}
            role={user!.role}
          />
        </div>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList className="flex-wrap">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Visits</TabsTrigger>
          <TabsTrigger value="records">Diagnoses</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="investigations">Lab &amp; imaging</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <ClinicalTimeline events={events} />
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <Card className="gap-4 p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Emergency contact</p>
                <p className="text-sm font-medium">
                  {patient.emergency_contact_name || "—"}
                  {patient.emergency_contact_phone ? ` · ${patient.emergency_contact_phone}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Blood type</p>
                <p className="text-sm font-medium">{patient.blood_type || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date of birth</p>
                <p className="text-sm font-medium">{formatDate(patient.date_of_birth)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Registered</p>
                <p className="text-sm font-medium">{formatDate(patient.created_at)}</p>
              </div>
            </div>
            {patient.notes && (
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm">{patient.notes}</p>
              </div>
            )}
          </Card>
        </TabsContent>

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
                    <li key={appt.id}>
                      <Link
                        href={`/consultation/${appt.id}`}
                        className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/40"
                      >
                        <div>
                          <p className="text-sm font-medium">{formatDateTime(appt.scheduled_at)}</p>
                          <p className="text-xs text-muted-foreground">
                            {appt.reason || "General visit"}
                            {doctor?.full_name ? ` · Dr. ${doctor.full_name}` : ""}
                          </p>
                        </div>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </Link>
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
              title="No diagnoses recorded"
              description="Records are only visible to the treating doctor, nurses, and admins."
            />
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const doctor = Array.isArray(record.doctor) ? record.doctor[0] : record.doctor;
                return (
                  <Card key={record.id} className="gap-2 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Dr. {doctor?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(record.created_at)}</p>
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

        <TabsContent value="prescriptions" className="mt-4">
          {!prescriptions || prescriptions.length === 0 ? (
            <EmptyState icon={Pill} title="No prescriptions issued" />
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx) => {
                const doctor = Array.isArray(rx.doctor) ? rx.doctor[0] : rx.doctor;
                const meta = prescriptionStatus[rx.status] ?? prescriptionStatus.pending;
                return (
                  <Card key={rx.id} className="gap-2 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {formatDate(rx.created_at)}
                        {doctor?.full_name ? ` · Dr. ${doctor.full_name}` : ""}
                      </p>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </div>
                    <ul className="space-y-1">
                      {rx.prescription_items.map((item) => (
                        <li key={item.id} className="text-sm">
                          <span className="font-medium">{item.medication_name}</span>
                          {item.dosage && ` · ${item.dosage}`}
                          {item.frequency && ` · ${item.frequency}`}
                          {` · qty ${item.quantity}`}
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="investigations" className="mt-4">
          {!investigations || investigations.length === 0 ? (
            <EmptyState icon={FlaskConical} title="No lab or imaging orders" />
          ) : (
            <div className="space-y-3">
              {investigations.map((inv) => {
                const meta = investigationStatus[inv.status] ?? investigationStatus.ordered;
                return (
                  <Card key={inv.id} className="gap-1.5 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium capitalize">
                        {inv.category} · {inv.test_name}
                      </p>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(inv.ordered_at)}</p>
                    {inv.result_text && <p className="text-sm">{inv.result_text}</p>}
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

        <TabsContent value="documents" className="mt-4">
          <PatientDocuments patientId={patient.id} role={user!.role} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
