"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Activity,
  Loader2,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  Receipt,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CalendarClock,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
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

const HIGHLIGHTS = [
  { icon: CalendarClock, text: "Scheduling, queue, and triage in one live view" },
  { icon: ClipboardList, text: "Charting, prescriptions, and billing that stay in sync" },
  { icon: ShieldCheck, text: "Role-based access built in, from front desk to admin" },
];

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [demoRole, setDemoRole] = useState<Role | null>(null);
  const [isDemoPending, startDemoTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Brand panel — desktop only */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[oklch(0.19_0.025_260)] p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <motion.div
          className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-[oklch(0.55_0.15_258)] blur-3xl"
          animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -right-16 bottom-0 size-80 rounded-full bg-[oklch(0.6_0.13_155)] blur-3xl"
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 flex items-center gap-2.5"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/15">
            <Activity className="size-4.5" strokeWidth={2.25} />
          </div>
          <span className="text-base font-semibold tracking-tight">Clinic OS</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="relative z-10 max-w-md"
        >
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-white/15">
            <Sparkles className="size-3" />
            Built for modern clinics
          </div>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
            Run your clinic from one calm, connected workspace.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Appointments, queue, records, and billing — everyone on your team sees the same
            live picture, in real time.
          </p>

          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.25 + i * 0.08 }}
                className="flex items-start gap-3 text-sm text-white/75"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10">
                  <Icon className="size-3.5" strokeWidth={2} />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="relative z-10 text-xs text-white/40"
        >
          © {new Date().getFullYear()} Clinic OS. All rights reserved.
        </motion.p>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:w-[55%]">
        <div
          className="pointer-events-none absolute inset-0 -z-10 lg:hidden"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--primary) 8%, transparent), transparent)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm lg:hidden">
              <Activity className="size-5" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your clinic workspace
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-foreground/[0.03] sm:p-7"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <Mail className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="email"
                    type="email"
                    placeholder="you@clinic.com"
                    autoComplete="email"
                    {...register("email")}
                  />
                </InputGroup>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <InputGroup>
                  <InputGroupAddon>
                    <Lock className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
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

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {DEMO_ROLES.map(({ role, icon: Icon, blurb }, i) => (
              <motion.button
                key={role}
                type="button"
                disabled={isDemoPending}
                onClick={() => onDemoLogin(role)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.15 + i * 0.05 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/40 disabled:pointer-events-none disabled:opacity-50"
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
              </motion.button>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New clinic?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create the first account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
