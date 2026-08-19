"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, Globe, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "#platform", label: "Platform" },
  { href: "#workflows", label: "Workflows" },
  { href: "#ai", label: "AI" },
  { href: "#pricing", label: "Pricing" },
];

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "UR", label: "اردو" },
  { code: "AR", label: "العربية" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("EN");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d1120]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-4" strokeWidth={2.25} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            Clinic OS
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white">
                  <Globe className="size-3.5" />
                  {lang}
                </button>
              }
            />
            <DropdownMenuContent align="end">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)}>
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Button
            size="sm"
            className="rounded-full px-4"
            nativeButton={false}
            render={<Link href="/signup">Get started</Link>}
          />
        </div>

        <button
          className="text-white/80 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#0d1120] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
            <Button
              variant="outline"
              className="flex-1 border-white/15 bg-transparent text-white"
              nativeButton={false}
              render={<Link href="/login">Sign in</Link>}
            />
            <Button
              className="flex-1"
              nativeButton={false}
              render={<Link href="/signup">Get started</Link>}
            />
          </div>
        </div>
      )}
    </header>
  );
}
