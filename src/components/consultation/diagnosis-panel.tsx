"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveSoapNote, saveNoteTemplate } from "@/actions/consultation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database";

type MedicalRecord = Database["public"]["Tables"]["medical_records"]["Row"];
type Template = Database["public"]["Tables"]["clinical_note_templates"]["Row"];

interface FormValues {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export function DiagnosisPanel({
  appointmentId,
  patientId,
  record,
  canEdit,
}: {
  appointmentId: string;
  patientId: string;
  record: MedicalRecord | null;
  canEdit: boolean;
}) {
  const [saved, setSaved] = useState<"draft" | "completed" | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      subjective: record?.soap_subjective ?? "",
      objective: record?.soap_objective ?? "",
      assessment: record?.diagnosis ?? "",
      plan: record?.soap_plan ?? "",
    },
  });

  useEffect(() => {
    if (!canEdit) return;
    createClient()
      .from("clinical_note_templates")
      .select("*")
      .order("name")
      .then(({ data }) => setTemplates(data ?? []));
  }, [canEdit]);

  function applyTemplate(id: string | null) {
    const t = templates.find((tpl) => tpl.id === id);
    if (!t) return;
    setValue("subjective", t.subjective ?? "");
    setValue("objective", t.objective ?? "");
    setValue("assessment", t.assessment ?? "");
    setValue("plan", t.plan ?? "");
  }

  async function onSubmit(values: FormValues, complete: boolean) {
    await saveSoapNote({ appointmentId, patientId, ...values, complete });
    setSaved(complete ? "completed" : "draft");
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) return;
    const values = watch();
    await saveNoteTemplate({ name: templateName, ...values });
    setSaveTemplateOpen(false);
    setTemplateName("");
    createClient()
      .from("clinical_note_templates")
      .select("*")
      .order("name")
      .then(({ data }) => setTemplates(data ?? []));
  }

  if (!canEdit && !record) {
    return (
      <p className="text-sm text-muted-foreground">
        No SOAP note has been recorded for this visit yet.
      </p>
    );
  }

  return (
    <form className="space-y-4">
      {canEdit && templates.length > 0 && (
        <div className="flex items-center gap-2">
          <Label className="shrink-0 text-xs">Load template</Label>
          <Select onValueChange={applyTemplate}>
            <SelectTrigger className="h-8 w-56 text-xs">
              <SelectValue placeholder="Select a saved template…" />
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

      <div className="space-y-1.5">
        <Label>Subjective</Label>
        <Textarea rows={2} placeholder="Patient-reported history…" disabled={!canEdit} {...register("subjective")} />
      </div>
      <div className="space-y-1.5">
        <Label>Objective</Label>
        <Textarea rows={2} placeholder="Examination findings…" disabled={!canEdit} {...register("objective")} />
      </div>
      <div className="space-y-1.5">
        <Label>Assessment</Label>
        <Textarea rows={3} placeholder="Diagnosis / clinical impression…" disabled={!canEdit} {...register("assessment")} />
      </div>
      <div className="space-y-1.5">
        <Label>Plan</Label>
        <Textarea rows={2} placeholder="Treatment plan…" disabled={!canEdit} {...register("plan")} />
      </div>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={isSubmitting} onClick={handleSubmit((v) => onSubmit(v, false))}>
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            Save draft
          </Button>
          <Button type="button" size="sm" disabled={isSubmitting} onClick={handleSubmit((v) => onSubmit(v, true))}>
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            Complete consultation
          </Button>
          <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
            <DialogTrigger
              render={
                <Button type="button" size="sm" variant="ghost">
                  <BookmarkPlus className="size-3.5" />
                  Save as template
                </Button>
              }
            />
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle>Save as template</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
                <Button type="button" className="w-full" onClick={handleSaveTemplate}>
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {saved && <p className="text-xs text-success">Saved ({saved}).</p>}
        </div>
      )}
    </form>
  );
}
