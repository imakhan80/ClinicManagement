import { FlaskConical } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { InvestigationResultRow } from "@/components/laboratory/investigation-result-row";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default async function LaboratoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const user = await getCurrentUser();
  const supabase = await createClient();
  const canUpdate = user?.role === "admin" || user?.role === "nurse";

  const { data: investigations } = await supabase
    .from("investigations")
    .select(
      "*, patients(full_name), ordered_by:profiles!ordered_by(full_name)"
    )
    .in("status", ["ordered", "in_progress"])
    .order("ordered_at", { ascending: true });

  const rows = (investigations ?? []).map((inv) => {
    const patient = Array.isArray(inv.patients) ? inv.patients[0] : inv.patients;
    const doctor = Array.isArray(inv.ordered_by) ? inv.ordered_by[0] : inv.ordered_by;
    return { ...inv, patientName: patient?.full_name ?? "Unknown", doctorName: doctor?.full_name ?? null };
  });

  const labRows = rows.filter((r) => r.category === "lab");
  const imagingRows = rows.filter((r) => r.category === "imaging");
  const otherRows = rows.filter((r) => r.category === "other");

  return (
    <div className="space-y-6">
      <PageHeader title="Laboratory" description="Process pending lab and imaging orders." />

      {!canUpdate && (
        <p className="text-xs text-muted-foreground">
          Only admin and nursing staff can enter results here — you have read-only access.
        </p>
      )}

      <Tabs defaultValue={tab === "imaging" ? "imaging" : "lab"}>
        <TabsList>
          <TabsTrigger value="lab">Lab ({labRows.length})</TabsTrigger>
          <TabsTrigger value="imaging">Imaging ({imagingRows.length})</TabsTrigger>
          {otherRows.length > 0 && <TabsTrigger value="other">Other ({otherRows.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="lab" className="mt-4 space-y-2.5">
          {labRows.length === 0 ? (
            <EmptyState icon={FlaskConical} title="No pending lab orders" />
          ) : (
            labRows.map((inv) => (
              <InvestigationResultRow key={inv.id} investigation={inv} canUpdate={canUpdate} />
            ))
          )}
        </TabsContent>

        <TabsContent value="imaging" className="mt-4 space-y-2.5">
          {imagingRows.length === 0 ? (
            <EmptyState icon={FlaskConical} title="No pending imaging orders" />
          ) : (
            imagingRows.map((inv) => (
              <InvestigationResultRow key={inv.id} investigation={inv} canUpdate={canUpdate} />
            ))
          )}
        </TabsContent>

        {otherRows.length > 0 && (
          <TabsContent value="other" className="mt-4 space-y-2.5">
            {otherRows.map((inv) => (
              <InvestigationResultRow key={inv.id} investigation={inv} canUpdate={canUpdate} />
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
