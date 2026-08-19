"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patientSchema, type PatientInput } from "@/lib/validations/patient";
import { createPatient, updatePatient } from "@/actions/patients";
import type { Database } from "@/lib/types/database";

type Patient = Database["public"]["Tables"]["patients"]["Row"];

export function PatientForm({
  patient,
  onSuccess,
}: {
  patient?: Patient;
  onSuccess?: (id: string) => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient
      ? {
          full_name: patient.full_name,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender ?? undefined,
          phone: patient.phone ?? "",
          email: patient.email ?? "",
          address: patient.address ?? "",
          emergency_contact_name: patient.emergency_contact_name ?? "",
          emergency_contact_phone: patient.emergency_contact_phone ?? "",
          blood_type: patient.blood_type ?? "",
          allergies: patient.allergies ?? [],
          notes: patient.notes ?? "",
        }
      : { allergies: [] },
  });

  async function onSubmit(values: PatientInput) {
    setServerError(null);
    const result = patient
      ? await updatePatient(patient.id, values)
      : await createPatient(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    router.refresh();
    if (result.id) onSuccess?.(result.id);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" placeholder="Amara Okafor" {...register("full_name")} />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date_of_birth">Date of birth</Label>
          <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
          {errors.date_of_birth && (
            <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select
            value={watch("gender")}
            onValueChange={(v) => setValue("gender", v as PatientInput["gender"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="+1 555 010 2020" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="patient@email.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" placeholder="123 Wellness Ave" {...register("address")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emergency_contact_name">Emergency contact</Label>
          <Input id="emergency_contact_name" placeholder="Name" {...register("emergency_contact_name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emergency_contact_phone">Emergency phone</Label>
          <Input id="emergency_contact_phone" placeholder="+1 555 010 2021" {...register("emergency_contact_phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="blood_type">Blood type</Label>
          <Input id="blood_type" placeholder="O+" {...register("blood_type")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} placeholder="Relevant history, notes…" {...register("notes")} />
        </div>
      </div>

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {patient ? "Save changes" : "Add patient"}
      </Button>
    </form>
  );
}
