import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/search-input";
import { NewPatientSheet } from "@/components/patients/new-patient-sheet";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { calculateAge, formatDate, initials } from "@/lib/format";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("patients")
    .select("id, full_name, mrn, date_of_birth, gender, phone, email, created_at")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("full_name", `%${q}%`);

  const { data: patients } = await query;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Search, register, and manage patient records."
        actions={<NewPatientSheet />}
      />

      <SearchInput placeholder="Search patients by name…" />

      {!patients || patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No patients match your search" : "No patients yet"}
          description={q ? "Try a different name." : "Register your first patient to get started."}
        />
      ) : (
        <Card className="gap-0 overflow-hidden p-0 shadow-sm">
          <ul className="divide-y divide-border">
            {patients.map((patient) => (
              <li key={patient.id}>
                <Link
                  href={`/patients/${patient.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                      {initials(patient.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{patient.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {patient.mrn} · {calculateAge(patient.date_of_birth)} yrs
                      {patient.gender ? ` · ${patient.gender}` : ""}
                    </p>
                  </div>
                  <div className="hidden text-right text-xs text-muted-foreground sm:block">
                    <p>{patient.phone || patient.email || "—"}</p>
                    <p>Added {formatDate(patient.created_at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
