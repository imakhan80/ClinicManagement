"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, Loader2, ShieldCheck, Stethoscope, HeartPulse, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { login, loginAsDemo } from "@/actions/auth";
import type { Role } from "@/lib/types/database";
import { roleLabel } from "@/lib/status";

const DEMO_ROLES: { role: Role; icon: typeof ShieldCheck; blurb: string }[] = [
  { role: "admin", icon: ShieldCheck, blurb: "Clinic-wide view" },
  { role: "doctor", icon: Stethoscope, blurb: "Today's patients" },
  { role: "nurse", icon: HeartPulse, blurb: "Triage & queue" },
  { role: "receptionist", icon: Receipt, blurb: "Front desk & billing" },
];

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<Role | null>(null);
  const [isDemoPending, startDemoTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const result = await login(values);
    if (result?.error) setServerError(result.error);
  }

  function onDemoLogin(role: Role) {
    setServerError(null);
    setDemoRole(role);
    startDemoTransition(async () => {
      const result = await loginAsDemo(role);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Activity className="size-5" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your clinic workspace
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@clinic.com" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            {serverError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {serverError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </Button>
          </div>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">Or try a demo account</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {DEMO_ROLES.map(({ role, icon: Icon, blurb }) => (
            <button
              key={role}
              type="button"
              disabled={isDemoPending}
              onClick={() => onDemoLogin(role)}
              className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                {isDemoPending && demoRole === role ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Icon className="size-3.5" strokeWidth={2} />
                )}
              </div>
              <span className="text-sm font-medium">{roleLabel[role]}</span>
              <span className="text-xs text-muted-foreground">{blurb}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New clinic?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create the first account
          </Link>
        </p>
      </div>
    </div>
  );
}
