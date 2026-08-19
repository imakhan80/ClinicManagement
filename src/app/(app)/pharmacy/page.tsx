import { Pill, PackageSearch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { DispenseRow } from "@/components/pharmacy/dispense-row";
import { NewMedicationDialog } from "@/components/pharmacy/new-medication-dialog";
import { formatCurrency } from "@/lib/format";

export default async function PharmacyPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const canDispense = user?.role === "admin" || user?.role === "nurse";

  const [{ data: prescriptions }, { data: medications }] = await Promise.all([
    supabase
      .from("prescriptions")
      .select(
        "id, status, created_at, patients(full_name), doctor:profiles!doctor_id(full_name), prescription_items(*)"
      )
      .in("status", ["pending", "partially_dispensed"])
      .order("created_at", { ascending: false }),
    supabase.from("medications").select("*").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pharmacy"
        description="Fulfil prescriptions and manage medication stock."
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold">Pending prescriptions</h2>
        {!prescriptions || prescriptions.length === 0 ? (
          <EmptyState icon={Pill} title="No pending prescriptions" />
        ) : (
          <div className="space-y-3">
            {prescriptions.map((rx) => {
              const patient = Array.isArray(rx.patients) ? rx.patients[0] : rx.patients;
              const doctor = Array.isArray(rx.doctor) ? rx.doctor[0] : rx.doctor;
              return (
                <Card key={rx.id} className="gap-3 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{patient?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doctor?.full_name ? `Dr. ${doctor.full_name}` : ""}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {rx.prescription_items.map((item) => (
                      <DispenseRow
                        key={item.id}
                        itemId={item.id}
                        medicationName={item.medication_name}
                        dosage={item.dosage}
                        quantity={item.quantity}
                        quantityDispensed={item.quantity_dispensed}
                      />
                    ))}
                  </div>
                  {!canDispense && (
                    <p className="text-xs text-muted-foreground">
                      Only pharmacy staff (admin/nurse) can mark items dispensed.
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Medication stock</h2>
          {user?.role === "admin" && <NewMedicationDialog />}
        </div>
        {!medications || medications.length === 0 ? (
          <EmptyState icon={PackageSearch} title="No medications in catalog" />
        ) : (
          <Card className="gap-0 overflow-hidden p-0 shadow-sm">
            <ul className="divide-y divide-border">
              {medications.map((med) => (
                <li key={med.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{med.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[med.form, med.strength].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(Number(med.unit_price))}
                    </p>
                    <p
                      className={`text-xs tabular-nums ${
                        med.stock_quantity <= med.reorder_level
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }`}
                    >
                      {med.stock_quantity} in stock
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
