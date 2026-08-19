import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  Stethoscope,
  Pill,
  FlaskConical,
  Receipt,
  CalendarCheck2,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/lib/format";

export interface TimelineEvent {
  id: string;
  type:
    | "visit"
    | "diagnosis"
    | "prescription"
    | "investigation"
    | "procedure"
    | "payment"
    | "follow_up"
    | "communication";
  date: string;
  title: string;
  subtitle?: string;
  href?: string;
}

const TYPE_META: Record<TimelineEvent["type"], { icon: LucideIcon; className: string }> = {
  visit: { icon: CalendarClock, className: "bg-info/10 text-info" },
  diagnosis: { icon: Stethoscope, className: "bg-primary/10 text-primary" },
  prescription: { icon: Pill, className: "bg-success/10 text-success" },
  investigation: { icon: FlaskConical, className: "bg-warning/15 text-warning-foreground" },
  procedure: { icon: ClipboardList, className: "bg-primary/10 text-primary" },
  payment: { icon: Receipt, className: "bg-accent text-accent-foreground" },
  follow_up: { icon: CalendarCheck2, className: "bg-muted text-muted-foreground" },
  communication: { icon: MessageSquare, className: "bg-info/10 text-info" },
};

export function ClinicalTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <EmptyState icon={CalendarClock} title="No activity yet" />;
  }

  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <ol className="relative space-y-5 pl-8 before:absolute before:top-1 before:bottom-1 before:left-[15px] before:w-px before:bg-border">
      {sorted.map((event) => {
        const meta = TYPE_META[event.type];
        const content = (
          <div className="flex-1 rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors group-hover:border-primary/40">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="shrink-0 text-xs text-muted-foreground">{formatDateTime(event.date)}</p>
            </div>
            {event.subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{event.subtitle}</p>
            )}
          </div>
        );
        return (
          <li key={`${event.type}-${event.id}`} className="group relative flex gap-3">
            <span
              className={`absolute top-0 -left-8 flex size-8 items-center justify-center rounded-full ring-4 ring-background ${meta.className}`}
            >
              <meta.icon className="size-[15px]" />
            </span>
            {event.href ? (
              <Link href={event.href} className="flex-1">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}
