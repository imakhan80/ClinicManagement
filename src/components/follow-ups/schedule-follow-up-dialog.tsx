"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { scheduleFollowUp } from "@/actions/follow-ups";

interface FormValues {
  scheduledAt: string;
}

export function ScheduleFollowUpDialog({
  followUpId,
  patientId,
  doctorId,
}: {
  followUpId: string;
  patientId: string;
  doctorId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    const result = await scheduleFollowUp({
      followUpId,
      patientId,
      doctorId: doctorId ?? undefined,
      scheduledAt: values.scheduledAt,
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Follow-up scheduled");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <CalendarPlus className="size-3.5" />
            Schedule
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Schedule follow-up</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <Input type="datetime-local" {...register("scheduledAt", { required: true })} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
