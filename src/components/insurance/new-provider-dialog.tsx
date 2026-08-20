"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createInsuranceProvider } from "@/actions/insurance";

interface FormValues {
  name: string;
  phone: string;
  email: string;
}

export function NewProviderDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    const result = await createInsuranceProvider(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Provider added");
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
            New provider
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New insurance provider</DialogTitle>
          <DialogDescription>Add an insurer to the catalog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name", { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            Add
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
