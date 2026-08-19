import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Alert {
  label: string;
  count: number;
  icon: LucideIcon;
  tone: "warning" | "destructive";
  href: string;
}

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  const active = alerts.filter((a) => a.count > 0);

  return (
    <Card className="gap-3 p-5 shadow-sm">
      <h2 className="text-sm font-semibold">Alerts</h2>
      {active.length === 0 ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-success" />
          Nothing needs attention right now.
        </div>
      ) : (
        <ul className="space-y-1">
          {active.map((alert) => (
            <li key={alert.label}>
              <Link
                href={alert.href}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    alert.tone === "warning" ? "bg-warning/15 text-warning-foreground" : "bg-destructive/10 text-destructive"
                  )}
                >
                  <alert.icon className="size-[15px]" />
                </span>
                <span className="flex-1">
                  <span className="font-semibold tabular-nums">{alert.count}</span> {alert.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
