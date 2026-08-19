"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <Bell className="size-[18px]" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-3 py-2 text-sm font-medium">Notifications</div>
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          You're all caught up.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
