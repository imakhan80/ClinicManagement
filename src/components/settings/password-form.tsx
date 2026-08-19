"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/actions/settings";

interface FormValues {
  password: string;
  confirm_password: string;
}

export function PasswordForm() {
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    if (values.password !== values.confirm_password) {
      toast.error("Passwords don't match");
      return;
    }
    const result = await changePassword(values);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Password updated");
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label>New password</Label>
        <Input type="password" {...register("password", { required: true, minLength: 6 })} />
        {errors.password && <p className="text-xs text-destructive">At least 6 characters</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Confirm password</Label>
        <Input type="password" {...register("confirm_password", { required: true })} />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
        Update password
      </Button>
    </form>
  );
}
