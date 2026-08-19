"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOwnProfile } from "@/actions/settings";

interface FormValues {
  full_name: string;
  phone: string;
}

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string | null }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { full_name: fullName, phone: phone ?? "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateOwnProfile(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Full name</Label>
        <Input {...register("full_name", { required: true })} />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input placeholder="Optional" {...register("phone")} />
      </div>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
