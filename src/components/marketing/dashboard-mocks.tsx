import {
  Activity,
  Users,
  CalendarClock,
  Receipt,
  Sparkles,
  Stethoscope,
  FlaskConical,
  Pill,
  FileText,
  Bell,
  QrCode,
} from "lucide-react";

export function MainDashboardMock() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#12182b] shadow-2xl shadow-black/40 ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-3 text-[11px] font-medium text-white/40">app.clinicos.health</span>
      </div>
      <div className="flex">
        <div className="hidden w-14 flex-col items-center gap-4 border-r border-white/10 py-4 sm:flex">
          {[Activity, Users, CalendarClock, FlaskConical, Pill, Receipt].map((Icon, i) => (
            <div
              key={i}
              className={`flex size-8 items-center justify-center rounded-lg ${
                i === 0 ? "bg-primary/90 text-white" : "text-white/35"
              }`}
            >
              <Icon className="size-4" />
            </div>
          ))}
        </div>
        <div className="flex-1 space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-white">Good morning, Dr. Iman</p>
              <p className="text-[11px] text-white/40">Tuesday, 12 rooms active</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-full bg-white/10">
                <Bell className="size-3.5 text-white/60" />
              </div>
              <div className="size-7 rounded-full bg-gradient-to-br from-primary to-info" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Patients today", value: "128", tone: "text-white" },
              { label: "In queue", value: "9", tone: "text-warning" },
              { label: "Revenue", value: "$8.2k", tone: "text-success" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/5">
                <p className="text-[10px] text-white/40">{s.label}</p>
                <p className={`mt-1 text-base font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/5">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[11px] font-medium text-white/70">Live queue</p>
              <span className="flex items-center gap-1 text-[10px] text-success">
                <span className="size-1.5 rounded-full bg-success" /> Live
              </span>
            </div>
            <div className="space-y-2">
              {[
                { name: "A. Karim", stage: "Triage", tone: "bg-info/20 text-info" },
                { name: "S. Malik", stage: "Ready", tone: "bg-warning/20 text-warning" },
                { name: "R. Osei", stage: "In consult", tone: "bg-primary/25 text-white" },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-2 text-white/70">
                    <span className="size-5 rounded-full bg-white/10" />
                    {p.name}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${p.tone}`}>
                    {p.stage}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary/25 to-info/15 p-3 ring-1 ring-white/5">
            <Sparkles className="size-4 shrink-0 text-primary-foreground/90" />
            <p className="text-[11px] text-white/75">
              AI copilot drafted 3 consult summaries awaiting your review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DoctorWorkspaceMock() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Stethoscope className="size-4 text-primary" />
          <p className="text-sm font-semibold">Consultation · Amara Okafor</p>
        </div>
        <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-medium text-warning-foreground">
          In consult
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-5">
        <div className="space-y-3 sm:col-span-3">
          <div className="rounded-xl border border-border p-3.5">
            <p className="mb-2 text-[11px] font-semibold text-muted-foreground uppercase">Vitals</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["BP", "120/80"],
                ["Pulse", "78"],
                ["SpO2", "98%"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted/60 py-2">
                  <p className="text-[10px] text-muted-foreground">{k}</p>
                  <p className="text-xs font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border p-3.5">
            <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
              Diagnosis
            </p>
            <div className="h-14 rounded-lg bg-muted/60" />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-accent/60 p-3">
            <FileText className="size-4 shrink-0 text-accent-foreground" />
            <p className="text-[11px] text-accent-foreground">
              AI drafted a SOAP note from the visit — ready to review.
            </p>
          </div>
        </div>
        <div className="space-y-3 sm:col-span-2">
          <div className="rounded-xl border border-border p-3.5">
            <p className="mb-2 text-[11px] font-semibold text-muted-foreground uppercase">
              Prescription
            </p>
            <div className="space-y-1.5">
              <div className="h-2.5 w-4/5 rounded bg-muted" />
              <div className="h-2.5 w-3/5 rounded bg-muted" />
            </div>
          </div>
          <div className="rounded-xl border border-border p-3.5">
            <p className="mb-2 text-[11px] font-semibold text-muted-foreground uppercase">
              Investigations
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <FlaskConical className="size-3.5" /> CBC · ordered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatientPortalMock() {
  return (
    <div className="mx-auto w-[220px] overflow-hidden rounded-[2rem] border-[6px] border-[#12182b] bg-background shadow-2xl">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-xs font-semibold">Hi, Sara 👋</p>
        <QrCode className="size-3.5 text-muted-foreground" />
      </div>
      <div className="space-y-2.5 px-3.5 pb-4">
        <div className="rounded-xl bg-gradient-to-br from-primary to-info p-3 text-primary-foreground">
          <p className="text-[9px] opacity-80">Next appointment</p>
          <p className="text-[11px] font-semibold">Dr. Musa · Tomorrow 10:30</p>
        </div>
        {[
          { icon: FileText, label: "Lab report ready" },
          { icon: Pill, label: "Prescription refill" },
          { icon: Receipt, label: "Invoice due $45" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2"
          >
            <row.icon className="size-3.5 text-primary" />
            <p className="text-[10px] font-medium text-foreground">{row.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
