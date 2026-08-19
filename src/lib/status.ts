export type StatusTone = "neutral" | "info" | "warning" | "success" | "destructive";

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground border-transparent",
  info: "bg-info/10 text-info border-transparent",
  warning: "bg-warning/15 text-warning-foreground border-transparent",
  success: "bg-success/10 text-success border-transparent",
  destructive: "bg-destructive/10 text-destructive border-transparent",
};

export function statusClass(tone: StatusTone) {
  return toneClasses[tone];
}

export const appointmentStatus: Record<string, StatusMeta> = {
  scheduled: { label: "Scheduled", tone: "info" },
  checked_in: { label: "Checked in", tone: "warning" },
  in_progress: { label: "In progress", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  no_show: { label: "No show", tone: "destructive" },
};

export const queueStatus: Record<string, StatusMeta> = {
  waiting: { label: "Waiting", tone: "neutral" },
  triaged: { label: "Triaged", tone: "info" },
  ready: { label: "Ready for consult", tone: "warning" },
  in_consult: { label: "In consult", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const invoiceStatus: Record<string, StatusMeta> = {
  draft: { label: "Draft", tone: "neutral" },
  issued: { label: "Issued", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  partially_paid: { label: "Partially paid", tone: "warning" },
  void: { label: "Void", tone: "destructive" },
};

export const prescriptionStatus: Record<string, StatusMeta> = {
  pending: { label: "Pending", tone: "warning" },
  partially_dispensed: { label: "Partially dispensed", tone: "info" },
  dispensed: { label: "Dispensed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const investigationStatus: Record<string, StatusMeta> = {
  ordered: { label: "Ordered", tone: "warning" },
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const followUpStatus: Record<string, StatusMeta> = {
  pending: { label: "Pending", tone: "warning" },
  scheduled: { label: "Scheduled", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const roleLabel: Record<string, string> = {
  admin: "Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Front Desk",
};
