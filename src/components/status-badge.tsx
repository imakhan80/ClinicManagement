import { cn } from "@/lib/utils";
import { statusClass, type StatusTone } from "@/lib/status";

export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        statusClass(tone),
        className
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "info" && "bg-info",
          tone === "destructive" && "bg-destructive",
          tone === "neutral" && "bg-muted-foreground"
        )}
      />
      {label}
    </span>
  );
}
