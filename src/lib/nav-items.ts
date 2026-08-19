import {
  LayoutGrid,
  ListOrdered,
  CalendarClock,
  Users,
  Pill,
  Receipt,
  CalendarCheck2,
  FlaskConical,
  Scan,
  ClipboardList,
  ShieldCheck,
  Package,
  BarChart3,
  Sparkles,
  MessageSquare,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/types/database";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
  soon?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/queue", label: "Queue", icon: ListOrdered },
  { href: "/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/pharmacy", label: "Pharmacy", icon: Pill, roles: ["admin", "nurse", "doctor"] },
  { href: "/billing", label: "Billing", icon: Receipt, roles: ["admin", "receptionist"] },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarCheck2 },
  { href: "/laboratory", label: "Laboratory", icon: FlaskConical, roles: ["admin", "nurse", "doctor"] },
  { href: "/laboratory?tab=imaging", label: "Radiology", icon: Scan, roles: ["admin", "nurse", "doctor"] },
  { href: "/procedures", label: "Procedures", icon: ClipboardList, roles: ["admin", "doctor", "nurse"] },
  { href: "/insurance", label: "Insurance", icon: ShieldCheck, roles: ["admin", "receptionist"] },
  { href: "/inventory", label: "Inventory", icon: Package, roles: ["admin", "nurse"] },
  { href: "#", label: "Reports", icon: BarChart3, soon: true },
  { href: "#", label: "AI Assistant", icon: Sparkles, soon: true },
  { href: "#", label: "Communications", icon: MessageSquare, soon: true },
  { href: "#", label: "Settings", icon: Settings, soon: true },
];

export const MOBILE_PRIMARY = ["/dashboard", "/queue", "/appointments", "/patients"];

export function visibleNavFor(role: Role) {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
