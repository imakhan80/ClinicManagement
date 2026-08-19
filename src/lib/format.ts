import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy · h:mm a");
}

export function formatTime(date: string | Date) {
  return format(new Date(date), "h:mm a");
}

export function formatRelativeDay(date: string | Date) {
  const d = new Date(date);
  if (isToday(d)) return `Today · ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow · ${format(d, "h:mm a")}`;
  return format(d, "MMM d · h:mm a");
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function calculateAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}
