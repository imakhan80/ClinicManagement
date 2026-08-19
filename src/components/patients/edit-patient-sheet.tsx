"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PatientForm } from "@/components/patients/patient-form";
import type { Database } from "@/lib/types/database";

type Patient = Database["public"]["Tables"]["patients"]["Row"];

export function EditPatientSheet({ patient }: { patient: Patient }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
        Edit
      </Button>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit patient</SheetTitle>
          <SheetDescription>Update {patient.full_name}&apos;s record.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <PatientForm patient={patient} onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
