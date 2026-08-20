"use client";

import { useState } from "react";
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
import { createCommunicationTemplate } from "@/actions/communications";

interface FormValues {
  name: string;
  channel: "call" | "sms" | "email" | "in_person";
  subject: string;
  body: string;
}

export function NewTemplateDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } =
    useForm<FormValues>({ defaultValues: { channel: "sms" } });

  async function onSubmit(values: FormValues) {
    const result = await createCommunicationTemplate(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Template added");
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
            New template
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New template</DialogTitle>
          <DialogDescription>Reusable message text for logging communications.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="Appointment reminder" {...register("name", { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select value={watch("channel") ?? "sms"} onValueChange={(v) => setValue("channel", (v ?? "sms") as FormValues["channel"])}>
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
            <Label>Subject</Label>
            <Input placeholder="Optional (email)" {...register("subject")} />
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea rows={4} {...register("body", { required: true })} />
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
