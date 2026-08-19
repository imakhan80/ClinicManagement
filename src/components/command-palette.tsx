"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";
import { visibleNavFor } from "@/lib/nav-items";
import { initials } from "@/lib/format";
import type { Role } from "@/lib/types/database";

interface PatientResult {
  id: string;
  full_name: string;
  mrn: string;
}

export function CommandPalette({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setPatients([]);
      return;
    }
    const timeout = setTimeout(() => {
      createClient()
        .from("patients")
        .select("id, full_name, mrn")
        .or(`full_name.ilike.%${query}%,mrn.ilike.%${query}%`)
        .limit(6)
        .then(({ data }) => setPatients(data ?? []));
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted sm:flex"
      >
        <Search className="size-3.5" />
        Search…
        <kbd className="ml-4 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>
      <button
        onClick={() => setOpen(true)}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent sm:hidden"
      >
        <Search className="size-4" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search patients, or jump to a page…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          {patients.length > 0 && (
            <CommandGroup heading="Patients">
              {patients.map((p) => (
                <CommandItem key={p.id} onSelect={() => go(`/patients/${p.id}`)}>
                  <Users className="size-4" />
                  {p.full_name}
                  <span className="ml-auto text-xs text-muted-foreground">{p.mrn}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading="Go to">
            {visibleNavFor(role)
              .filter((item) => !item.soon)
              .map((item) => (
                <CommandItem key={item.href} onSelect={() => go(item.href)}>
                  <item.icon className="size-4" />
                  {item.label}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
