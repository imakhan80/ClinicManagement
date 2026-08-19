"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  LayoutGrid,
  ListOrdered,
  CalendarClock,
  Users,
  Pill,
  Receipt,
  CalendarCheck2,
  Menu,
  LogOut,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import { roleLabel } from "@/lib/status";
import { logout } from "@/actions/auth";
import type { CurrentUser } from "@/lib/auth/get-profile";
import type { Role } from "@/lib/types/database";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/queue", label: "Queue", icon: ListOrdered },
  { href: "/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/pharmacy", label: "Pharmacy", icon: Pill, roles: ["admin", "nurse", "doctor"] },
  { href: "/billing", label: "Billing", icon: Receipt, roles: ["admin", "receptionist"] },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarCheck2 },
];

const MOBILE_PRIMARY = ["/dashboard", "/queue", "/appointments", "/patients"];

function useVisibleNav(role: Role) {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const visibleNav = useVisibleNav(user.role);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop / tablet sidebar */}
      <aside className="hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-[72px] lg:w-64">
        <div className="flex h-16 items-center gap-2.5 px-4 lg:px-5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Activity className="size-4" strokeWidth={2.25} />
          </div>
          <span className="hidden text-sm font-semibold tracking-tight lg:inline">
            Clinic OS
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-2.5 py-3 lg:px-3">
          {visibleNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors lg:px-3",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
                title={item.label}
              >
                <item.icon className="size-[18px] shrink-0" strokeWidth={2} />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="hidden items-center gap-2.5 rounded-xl px-2 py-2 lg:flex">
            <Avatar className="size-8">
              <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-accent-foreground">
                {initials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.fullName}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {roleLabel[user.role]}
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="-ml-2">
                    <Menu className="size-5" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-64 bg-sidebar p-0 text-sidebar-foreground">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                    <Activity className="size-4" strokeWidth={2.25} />
                  </div>
                  <span className="text-sm font-semibold">Clinic OS</span>
                </div>
                <nav className="space-y-1 px-3 py-3">
                  {visibleNav.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSheetOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70"
                        )}
                      >
                        <item.icon className="size-[18px]" strokeWidth={2} />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t border-sidebar-border p-3">
                  <form action={logout}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70"
                    >
                      <LogOut className="size-[18px]" />
                      Sign out
                    </button>
                  </form>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-3.5" strokeWidth={2.25} />
            </div>
          </div>

          <div className="hidden md:block" />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 rounded-full py-1 pr-1 pl-1.5 hover:bg-accent">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                      {initials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">{user.fullName}</span>
                  <ChevronDown className="hidden size-3.5 text-muted-foreground sm:inline" />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Signed in as {roleLabel[user.role]}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-4 pt-6 pb-24 sm:px-6 md:pb-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
        {visibleNav
          .filter((item) => MOBILE_PRIMARY.includes(item.href))
          .map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="size-5" strokeWidth={active ? 2.25 : 2} />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
