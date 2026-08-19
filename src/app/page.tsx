import Link from "next/link";
import {
  Users,
  CalendarClock,
  ListOrdered,
  Stethoscope,
  FlaskConical,
  Pill,
  Receipt,
  BarChart3,
  Sparkles,
  ArrowRight,
  FileText,
  Mic,
  Bot,
  ShieldCheck,
  Lock,
  History,
  FileLock2,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import {
  MainDashboardMock,
  DoctorWorkspaceMock,
  PatientPortalMock,
} from "@/components/marketing/dashboard-mocks";

const MODULES = [
  { icon: Users, label: "Patient Management" },
  { icon: CalendarClock, label: "Appointments" },
  { icon: ListOrdered, label: "Queue" },
  { icon: Stethoscope, label: "Clinical Care" },
  { icon: FlaskConical, label: "Laboratory" },
  { icon: Pill, label: "Pharmacy" },
  { icon: Receipt, label: "Billing" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Sparkles, label: "AI" },
];

const JOURNEY = [
  "Registration",
  "Appointment",
  "Check-in",
  "Triage",
  "Consultation",
  "Lab",
  "Pharmacy",
  "Billing",
  "Follow-up",
];

const AI_FEATURES = [
  { icon: FileText, label: "Patient summary", desc: "Instant chart overview before every visit." },
  { icon: Mic, label: "SOAP drafting", desc: "Ambient notes turned into structured records." },
  { icon: FlaskConical, label: "Lab analysis", desc: "Flags abnormal results against patient history." },
  { icon: Bot, label: "Document intelligence", desc: "Extracts data from scans and referrals." },
  { icon: Sparkles, label: "AI receptionist", desc: "Handles booking and reminders around the clock." },
];

const SECURITY = [
  { icon: ShieldCheck, label: "Role-based access control" },
  { icon: Lock, label: "Supabase Row Level Security" },
  { icon: History, label: "Full audit trail" },
  { icon: FileLock2, label: "Encrypted document storage" },
];

const PRICING = [
  {
    name: "Starter",
    price: "$0",
    period: "for single-provider clinics",
    features: ["Up to 2 staff accounts", "Patients & appointments", "Basic billing"],
  },
  {
    name: "Growth",
    price: "$149",
    period: "per month",
    highlighted: true,
    features: [
      "Unlimited staff accounts",
      "Full clinical workflow",
      "Pharmacy & lab modules",
      "AI clinical copilot",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "for multi-branch networks",
    features: ["Multi-location support", "Dedicated onboarding", "Custom integrations"],
  },
];

export default function MarketingHomePage() {
  return (
    <div className="bg-background">
      <div className="bg-[#0d1120]">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 80% 0%, color-mix(in oklch, var(--primary) 25%, transparent), transparent 60%)",
            }}
          />
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-white/70 ring-1 ring-white/10">
                <Sparkles className="size-3.5 text-primary" />
                Now with an AI clinical copilot
              </span>
              <h1 className="mt-5 text-4xl leading-[1.1] font-semibold tracking-tight text-white sm:text-5xl">
                The intelligent operating system for modern clinics
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60">
                Clinic OS connects patients, appointments, triage, consultations,
                laboratory, pharmacy, and billing into one continuous workflow —
                so every role sees exactly what they need, the moment they need it.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="rounded-full px-6"
                  nativeButton={false}
                  render={
                    <Link href="/signup">
                      Get started <ArrowRight className="size-4" />
                    </Link>
                  }
                />
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/15 bg-transparent px-6 text-white hover:bg-white/5 hover:text-white"
                  nativeButton={false}
                  render={<a href="#platform">Explore platform</a>}
                />
              </div>
              <div className="mt-10 flex items-center gap-5 text-white/40">
                {["Reception", "Nursing", "Doctors", "Pharmacy"].map((r) => (
                  <span key={r} className="text-xs font-medium">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="lg:pl-6">
              <MainDashboardMock />
            </div>
          </div>
        </section>
      </div>

      {/* Platform / modules */}
      <section id="platform" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything your clinic needs. Connected.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every module shares one data model — nothing lives in a silo.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div
              key={m.label}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <m.icon className="size-[18px]" strokeWidth={2} />
              </div>
              <p className="mt-3.5 text-sm font-medium">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Connected journey */}
      <section id="workflows" className="bg-muted/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              One patient. One connected journey.
            </h2>
            <p className="mt-4 text-muted-foreground">
              A single record follows the patient through every step of care.
            </p>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-2 gap-y-4">
            {JOURNEY.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm">
                  {step}
                </div>
                {i < JOURNEY.length - 1 && (
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI copilot */}
      <section id="ai" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="size-3.5" /> AI Clinical Copilot
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              An assistant that understands clinical work
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built into every consultation — not a separate app to check.
            </p>
            <div className="mt-8 space-y-5">
              {AI_FEATURES.map((f) => (
                <div key={f.label} className="flex gap-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <f.icon className="size-[18px]" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-[#0d1120] p-8">
            <MainDashboardMock />
          </div>
        </div>
      </section>

      {/* Doctor workspace */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <DoctorWorkspaceMock />
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Designed around the doctor
            </h2>
            <p className="mt-4 text-muted-foreground">
              Vitals, diagnosis, investigations, and prescriptions live on one
              screen — so consultations move at the speed of conversation, not
              the speed of forms.
            </p>
          </div>
        </div>
      </section>

      {/* Patient portal */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              A better experience for patients
            </h2>
            <p className="mt-4 text-muted-foreground">
              Appointments, prescriptions, lab reports, and payments — all in a
              simple mobile experience patients actually want to use.
            </p>
          </div>
          <div className="order-1 flex justify-center lg:order-2">
            <PatientPortalMock />
          </div>
        </div>
      </section>

      {/* Real-time clinic */}
      <section className="bg-[#0d1120] py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Activity className="mx-auto size-8 text-primary" />
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            A clinic that runs in real time
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Live queue status, patient flow, and operational analytics update
            instantly across every screen in the building.
          </p>
        </div>
      </section>

      {/* Security */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Enterprise-grade security
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built on Supabase with row-level security enforced at the database.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECURITY.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="size-[18px]" strokeWidth={2} />
              </div>
              <p className="text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/40 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-muted-foreground">Start free. Scale as your clinic grows.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-6 shadow-sm ${
                  tier.highlighted
                    ? "border-primary bg-card ring-2 ring-primary"
                    : "border-border bg-card"
                }`}
              >
                <p className="text-sm font-medium text-muted-foreground">{tier.name}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{tier.price}</p>
                <p className="text-xs text-muted-foreground">{tier.period}</p>
                <ul className="mt-5 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                  nativeButton={false}
                  render={<Link href="/signup">Get started</Link>}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#0d1120] py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Build a smarter clinic today
          </h2>
          <p className="mt-4 text-white/60">
            Set up your workspace in minutes — no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="rounded-full px-6"
              nativeButton={false}
              render={
                <Link href="/signup">
                  Get started <ArrowRight className="size-4" />
                </Link>
              }
            />
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/15 bg-transparent px-6 text-white hover:bg-white/5 hover:text-white"
              nativeButton={false}
              render={<a href="mailto:hello@clinicos.health">Request demo</a>}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1120] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 border-t border-white/10 pt-10 sm:flex-row">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Activity className="size-3.5" />
                </div>
                <span className="text-sm font-semibold text-white">Clinic OS</span>
              </div>
              <p className="mt-3 max-w-xs text-xs text-white/40">
                The intelligent operating system for modern clinics.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm sm:grid-cols-4">
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-white/40 uppercase">Platform</p>
                <a href="#platform" className="block text-white/60 hover:text-white">
                  Features
                </a>
                <a href="#ai" className="block text-white/60 hover:text-white">
                  AI
                </a>
              </div>
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-white/40 uppercase">Security</p>
                <span className="block text-white/60">RBAC</span>
                <span className="block text-white/60">Row-level security</span>
              </div>
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-white/40 uppercase">Resources</p>
                <span className="block text-white/60">Privacy</span>
                <span className="block text-white/60">Terms</span>
              </div>
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-white/40 uppercase">Language</p>
                <p className="text-white/60">English | اردو | العربية</p>
              </div>
            </div>
          </div>
          <p className="mt-10 text-xs text-white/30">
            © {new Date().getFullYear()} Clinic OS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
