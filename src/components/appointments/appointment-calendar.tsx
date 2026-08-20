"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { appointmentStatus } from "@/lib/status";
import { formatTime } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types/database";

type ViewMode = "day" | "week" | "month";

interface CalendarAppointment {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string | null;
  patientName: string;
  doctorName: string | null;
  doctorId: string | null;
}

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 19;
const HOUR_HEIGHT = 56;

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-info",
  checked_in: "bg-warning",
  in_progress: "bg-warning",
  completed: "bg-success",
  cancelled: "bg-muted-foreground",
  no_show: "bg-destructive",
};

export function AppointmentCalendar() {
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [doctors, setDoctors] = useState<{ id: string; label: string }[]>([]);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    if (view === "day") return { start: anchor, end: anchor };
    if (view === "week")
      return { start: startOfWeek(anchor), end: endOfWeek(anchor) };
    return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
  }, [view, anchor]);

  const gridStart = view === "month" ? startOfWeek(range.start) : range.start;
  const gridEnd = view === "month" ? endOfWeek(range.end) : range.end;
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  useEffect(() => {
    createClient()
      .from("profiles")
      .select("id, full_name")
      .eq("role", "doctor")
      .then(({ data }) => setDoctors((data ?? []).map((d) => ({ id: d.id, label: d.full_name }))));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flips the loading indicator on before an async fetch, not derived state
    setLoading(true);
    const from = new Date(gridStart);
    from.setHours(0, 0, 0, 0);
    const to = new Date(gridEnd);
    to.setHours(23, 59, 59, 999);

    let query = createClient()
      .from("appointments")
      .select(
        "id, scheduled_at, duration_minutes, status, reason, doctor_id, patients(full_name), doctor:profiles!doctor_id(full_name)"
      )
      .gte("scheduled_at", from.toISOString())
      .lte("scheduled_at", to.toISOString())
      .order("scheduled_at", { ascending: true });

    if (doctorFilter !== "all") query = query.eq("doctor_id", doctorFilter);
    if (statusFilter !== "all")
      query = query.eq("status", statusFilter as AppointmentStatus);

    query.then(({ data }) => {
      setAppointments(
        (data ?? []).map((a) => {
          const patient = Array.isArray(a.patients) ? a.patients[0] : a.patients;
          const doctor = Array.isArray(a.doctor) ? a.doctor[0] : a.doctor;
          return {
            id: a.id,
            scheduled_at: a.scheduled_at,
            duration_minutes: a.duration_minutes,
            status: a.status,
            reason: a.reason,
            patientName: patient?.full_name ?? "Unknown",
            doctorName: doctor?.full_name ?? null,
            doctorId: a.doctor_id,
          };
        })
      );
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridStart.getTime(), gridEnd.getTime(), doctorFilter, statusFilter]);

  function navigate(dir: -1 | 1) {
    setAnchor((prev) =>
      view === "day" ? addDays(prev, dir) : view === "week" ? addWeeks(prev, dir) : addMonths(prev, dir)
    );
  }

  const title =
    view === "month"
      ? format(anchor, "MMMM yyyy")
      : view === "week"
        ? `${format(range.start, "MMM d")} – ${format(range.end, "MMM d, yyyy")}`
        : format(anchor, "EEEE, MMM d, yyyy");

  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon-sm" aria-label="Previous period" onClick={() => navigate(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next period" onClick={() => navigate(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <span className="ml-2 text-sm font-semibold">{title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  view === v ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Select value={doctorFilter} onValueChange={(v) => setDoctorFilter(v ?? "all")}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All doctors</SelectItem>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  Dr. {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(appointmentStatus).map(([key, meta]) => (
                <SelectItem key={key} value={key}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {view === "month" ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayAppts = appointments.filter((a) => isSameDay(new Date(a.scheduled_at), day));
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[104px] border-r border-b border-border p-1.5 last:border-r-0 ${
                    !isSameMonth(day, anchor) ? "bg-muted/20" : ""
                  }`}
                >
                  <span
                    className={`inline-flex size-5 items-center justify-center rounded-full text-xs ${
                      isToday(day) ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayAppts.slice(0, 3).map((a) => (
                      <Link
                        key={a.id}
                        href={`/consultation/${a.id}`}
                        className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] hover:bg-muted/60"
                      >
                        <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[a.status] ?? "bg-muted-foreground"}`} />
                        <span className="truncate">
                          {formatTime(a.scheduled_at)} {a.patientName}
                        </span>
                      </Link>
                    ))}
                    {dayAppts.length > 3 && (
                      <p className="px-1 text-[11px] text-muted-foreground">+{dayAppts.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `56px repeat(${days.length}, minmax(140px, 1fr))`,
              gridTemplateRows: `auto repeat(${hours.length}, ${HOUR_HEIGHT}px)`,
            }}
          >
            <div className="border-b border-border" style={{ gridColumn: 1, gridRow: 1 }} />
            {days.map((day, dayIdx) => (
              <div
                key={day.toISOString()}
                className="border-b border-l border-border py-2 text-center text-xs font-medium"
                style={{ gridColumn: dayIdx + 2, gridRow: 1 }}
              >
                <span className={isToday(day) ? "text-primary" : "text-muted-foreground"}>
                  {format(day, "EEE d")}
                </span>
              </div>
            ))}

            {hours.map((hour, hourIdx) => (
              <div
                key={`label-${hour}`}
                className="border-b border-border px-1 pt-0 text-right text-[10px] text-muted-foreground"
                style={{ gridColumn: 1, gridRow: hourIdx + 2 }}
              >
                <span className="-translate-y-1/2 block">{format(new Date(2000, 0, 1, hour), "h a")}</span>
              </div>
            ))}
            {days.map((day, dayIdx) => (
              <div
                key={`col-${dayIdx}`}
                className="relative border-l border-border"
                style={{ gridColumn: dayIdx + 2, gridRow: `2 / span ${hours.length}` }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-border/60"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {appointments
                  .filter((a) => isSameDay(new Date(a.scheduled_at), day))
                  .map((a) => {
                    const start = new Date(a.scheduled_at);
                    const minutesFromStart = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes();
                    const top = (minutesFromStart / 60) * HOUR_HEIGHT;
                    const height = Math.max(20, (a.duration_minutes / 60) * HOUR_HEIGHT - 2);
                    const meta = appointmentStatus[a.status] ?? appointmentStatus.scheduled;
                    return (
                      <Link
                        key={a.id}
                        href={`/consultation/${a.id}`}
                        className="absolute right-1 left-1 overflow-hidden rounded-md border-l-2 bg-card px-1.5 py-0.5 text-[11px] shadow-sm hover:shadow-md"
                        style={{
                          top,
                          height,
                          borderLeftColor: `var(--${meta.tone === "neutral" ? "muted-foreground" : meta.tone})`,
                        }}
                      >
                        <p className="truncate font-medium">{a.patientName}</p>
                        <p className="truncate text-muted-foreground">
                          {formatTime(a.scheduled_at)}
                          {a.doctorName ? ` · Dr. ${a.doctorName}` : ""}
                        </p>
                      </Link>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && appointments.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">No appointments in this range.</p>
      )}
    </div>
  );
}
