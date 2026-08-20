"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logCommunication } from "@/actions/communications";
import { createClient } from "@/lib/supabase/client";

interface FormValues {
  patient_id: string;
  channel: "call" | "sms" | "email" | "in_person";
  direction: "outbound" | "inbound";
  subject: string;
  body: string;
}

export function LogCommunicationDialog({ patientId }: { patientId?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [patients, setPatients] = useState<{ id: string; label: string }[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string; channel: string; subject: string | null; body: string }[]>([]);
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } =
    useForm<FormValues>({
      defaultValues: { patient_id: patientId ?? "", channel: "call", direction: "outbound", subject: "", body: "" },
    });

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    if (!patientId) {
      supabase
        .from("patients")
        .select("id, full_name")
        .order("full_name")
        .then(({ data }) => setPatients((data ?? []).map((p) => ({ id: p.id, label: p.full_name }))));
    }
    supabase
      .from("communication_templates")
      .select("id, name, channel, subject, body")
      .order("name")
      .then(({ data }) => setTemplates(data ?? []));
  }, [open, patientId]);

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setValue("channel", template.channel as FormValues["channel"]);
    setValue("subject", template.subject ?? "");
    setValue("body", template.body);
  }

  async function onSubmit(values: FormValues) {
    const result = await logCommunication(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Communication logged");
    reset({ patient_id: patientId ?? "", channel: "call", direction: "outbound", subject: "", body: "" });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Plus className="size-3.5" />
            Log communication
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log communication</DialogTitle>
          <DialogDescription>Record contact with a patient — nothing is sent.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {!patientId && (
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <Select value={watch("patient_id") ?? ""} onValueChange={(v) => setValue("patient_id", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <Label>Template (optional)</Label>
              <Select onValueChange={(v) => v && applyTemplate(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Start from a template…" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={watch("channel") ?? "call"} onValueChange={(v) => setValue("channel", (v ?? "call") as FormValues["channel"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="in_person">In person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select value={watch("direction") ?? "outbound"} onValueChange={(v) => setValue("direction", (v ?? "outbound") as FormValues["direction"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input placeholder="Optional" {...register("subject")} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} {...register("body", { required: true })} />
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
