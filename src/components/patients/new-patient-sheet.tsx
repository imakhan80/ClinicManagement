"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PatientForm } from "@/components/patients/patient-form";

export function NewPatientSheet() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        New patient
      </Button>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New patient</SheetTitle>
          <SheetDescription>Create a patient record to start booking visits.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <PatientForm
            onSuccess={(id) => {
              setOpen(false);
              router.push(`/patients/${id}`);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
