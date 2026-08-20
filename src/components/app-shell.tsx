"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Menu,
  LogOut,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
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
import { CommandPalette } from "@/components/command-palette";
import { NotificationsMenu } from "@/components/notifications-menu";
import { QuickAddMenu } from "@/components/quick-add-menu";
import { initials } from "@/lib/format";
import { roleLabel } from "@/lib/status";
import { logout } from "@/actions/auth";
import { MOBILE_PRIMARY, visibleNavFor } from "@/lib/nav-items";
import type { CurrentUser } from "@/lib/auth/get-profile";

const COLLAPSE_KEY = "clinic-os:sidebar-collapsed";

export function AppShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const visibleNav = visibleNavFor(user.role);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing collapsed state from a persisted preference, runs once on mount
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop / tablet sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out md:flex md:w-[72px]",
          !collapsed && "lg:w-64"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-4 lg:px-5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Activity className="size-4" strokeWidth={2.25} />
          </div>
          <span
            className={cn(
              "hidden text-sm font-semibold tracking-tight",
              !collapsed && "lg:inline"
            )}
          >
            Clinic OS
          </span>
          <button
            onClick={toggleCollapsed}
            className={cn(
              "ml-auto hidden size-6 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:flex"
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="size-3.5" />
            ) : (
              <ChevronsLeft className="size-3.5" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3 lg:px-3">
          {visibleNav.map((item) => {
            const active = item.href !== "#" && pathname.startsWith(item.href);
            if (item.soon) {
              return (
                <div
                  key={item.label}
                  title={`${item.label} — coming soon`}
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-sidebar-foreground/30 lg:px-3"
                >
                  <item.icon className="size-[18px] shrink-0" strokeWidth={2} />
                  <span className={cn("hidden truncate", !collapsed && "lg:inline")}>
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "ml-auto hidden rounded-full bg-sidebar-accent/60 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase",
                      !collapsed && "lg:inline"
                    )}
                  >
                    Soon
                  </span>
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors lg:px-3",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
                title={item.label}
              >
                {active && (
                  <motion.span
                    layoutId="active-nav-indicator"
                    className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-full bg-sidebar-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <item.icon className="size-[18px] shrink-0" strokeWidth={active ? 2.25 : 2} />
                <span className={cn("hidden truncate", !collapsed && "lg:inline")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-2 py-2",
              collapsed ? "lg:justify-center" : "hidden lg:flex"
            )}
          >
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-accent-foreground">
                {initials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="hidden min-w-0 flex-1 lg:block">
                  <p className="truncate text-sm font-medium">{user.fullName}</p>
                  <p className="truncate text-xs text-sidebar-foreground/60">
                    {roleLabel[user.role]}
                  </p>
                </div>
                <form action={logout} className="hidden lg:block">
                  <button
                    type="submit"
                    className="flex size-7 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    title="Sign out"
                  >
                    <LogOut className="size-4" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 md:hidden">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger
                  render={
                    <button
                      aria-label="Open navigation menu"
                      className="-ml-2 flex size-9 items-center justify-center rounded-lg hover:bg-accent"
                    >
                      <Menu className="size-5" />
                    </button>
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
                  <nav className="space-y-1 overflow-y-auto px-3 py-3">
                    {visibleNav.map((item) => {
                      if (item.soon) {
                        return (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/30"
                          >
                            <item.icon className="size-[18px]" strokeWidth={2} />
                            {item.label}
                            <span className="ml-auto rounded-full bg-sidebar-accent/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                              Soon
                            </span>
                          </div>
                        );
                      }
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
            <CommandPalette role={user.role} />
          </div>

          <div className="flex items-center gap-1.5">
            <QuickAddMenu role={user.role} />
            <NotificationsMenu userId={user.id} />
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
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-24 sm:px-6 md:pb-8 lg:px-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mx-auto w-full max-w-6xl"
          >
            {children}
          </motion.div>
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
