import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  return (
    <Card className="gap-2 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tone === "default" && "bg-accent text-accent-foreground",
            tone === "success" && "bg-success/10 text-success",
            tone === "warning" && "bg-warning/15 text-warning-foreground",
            tone === "destructive" && "bg-destructive/10 text-destructive"
          )}
        >
          <Icon className="size-[16px]" strokeWidth={2} />
        </div>
      </div>
      <p className="text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
