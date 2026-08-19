"use client";

import { useRouter } from "next/navigation";
import { Plus, UserPlus, CalendarPlus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/types/database";

export function QuickAddMenu({ role }: { role: Role }) {
  const router = useRouter();
  const canBill = role === "admin" || role === "receptionist";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="icon-sm" className="rounded-lg">
            <Plus className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push("/patients?new=1")}>
          <UserPlus className="size-4" />
          New patient
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/appointments?new=1")}>
          <CalendarPlus className="size-4" />
          New appointment
        </DropdownMenuItem>
        {canBill && (
          <DropdownMenuItem onClick={() => router.push("/billing?new=1")}>
            <Receipt className="size-4" />
            New invoice
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
