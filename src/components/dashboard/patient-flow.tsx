import { Card } from "@/components/ui/card";

interface Stage {
  label: string;
  count: number;
}

export function PatientFlow({ stages }: { stages: Stage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));

  return (
    <Card className="gap-4 p-5 shadow-sm">
      <h2 className="text-sm font-semibold">Patient flow — today</h2>
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const pct = Math.max(4, Math.round((stage.count / max) * 100));
          const opacity = 1 - i * 0.09;
          return (
            <div key={stage.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted-foreground">{stage.label}</span>
              <div className="h-6 flex-1 overflow-hidden rounded-md bg-muted/60">
                <div
                  className="flex h-full items-center justify-end rounded-md px-2 transition-all"
                  style={{ width: `${pct}%`, backgroundColor: `color-mix(in oklch, var(--primary) ${Math.round(opacity * 100)}%, transparent)` }}
                >
                  <span className="text-[11px] font-semibold text-primary-foreground tabular-nums">
                    {stage.count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
