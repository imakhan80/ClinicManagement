"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  // useSearchParams() reads empty during the initial (pre-hydration) render, so a
  // lazy useState initializer can't see "?new=1" — this must open post-hydration,
  // in an effect. handledNewParam makes it fire at most once, since otherwise a
  // changing searchParams/router identity across renders re-runs the effect
  // and cascades into repeated setState calls (React flags this — intentional here).
  const handledNewParam = useRef(false);

  useEffect(() => {
    if (handledNewParam.current) return;
    if (searchParams.get("new") === "1") {
      handledNewParam.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing open state to a one-time URL signal, guarded to run once
      setOpen(true);
      router.replace("/patients");
    }
  }, [searchParams, router]);

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
