"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addPatientPolicy } from "@/actions/insurance";
import { createClient } from "@/lib/supabase/client";

interface FormValues {
  provider_id: string;
  policy_number: string;
  group_number: string;
  coverage_percent: number;
  valid_from: string;
  valid_to: string;
}

export function AddPolicyDialog({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [providers, setProviders] = useState<{ id: string; label: string }[]>([]);
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } =
    useForm<FormValues>({ defaultValues: { coverage_percent: 80 } });

  useEffect(() => {
    if (!open || providers.length > 0) return;
    createClient()
      .from("insurance_providers")
      .select("id, name")
      .order("name")
      .then(({ data }) => setProviders((data ?? []).map((p) => ({ id: p.id, label: p.name }))));
  }, [open, providers.length]);

  async function onSubmit(values: FormValues) {
    const result = await addPatientPolicy({ ...values, patient_id: patientId, is_primary: true });
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Policy added");
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Plus className="size-3.5" />
            Add policy
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add insurance policy</DialogTitle>
          <DialogDescription>Attach a policy to this patient.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Provider</Label>
            <Select value={watch("provider_id") ?? ""} onValueChange={(v) => setValue("provider_id", v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Policy number</Label>
              <Input {...register("policy_number", { required: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Group number</Label>
              <Input {...register("group_number")} />
            </div>
            <div className="space-y-1.5">
              <Label>Coverage %</Label>
              <Input type="number" min={0} max={100} {...register("coverage_percent")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valid from</Label>
              <Input type="date" {...register("valid_from")} />
            </div>
            <div className="space-y-1.5">
              <Label>Valid to</Label>
              <Input type="date" {...register("valid_to")} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
