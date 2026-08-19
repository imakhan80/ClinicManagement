"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { updateStaffMember } from "@/actions/settings";
import { initials } from "@/lib/format";
import { roleLabel } from "@/lib/status";
import type { Role } from "@/lib/types/database";

export function StaffRow({
  id,
  fullName,
  role,
  phone,
  isSelf,
}: {
  id: string;
  fullName: string;
  role: Role;
  phone: string | null;
  isSelf: boolean;
}) {
  const [name, setName] = useState(fullName);
  const [selectedRole, setSelectedRole] = useState<Role>(role);
  const [isPending, startTransition] = useTransition();

  const dirty = name !== fullName || selectedRole !== role;

  function save() {
    startTransition(async () => {
      const result = await updateStaffMember({ id, full_name: name, role: selectedRole, phone });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Staff member updated");
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="bg-accent text-xs text-accent-foreground">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-8 w-44"
      />
      <Select
        value={selectedRole}
        onValueChange={(v) => v && setSelectedRole(v as Role)}
        disabled={isSelf}
      >
        <SelectTrigger className="h-8 w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">{roleLabel.admin}</SelectItem>
          <SelectItem value="doctor">{roleLabel.doctor}</SelectItem>
          <SelectItem value="nurse">{roleLabel.nurse}</SelectItem>
          <SelectItem value="receptionist">{roleLabel.receptionist}</SelectItem>
        </SelectContent>
      </Select>
      {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
      <Button
        size="sm"
        variant="outline"
        className="ml-auto"
        disabled={!dirty || isPending}
        onClick={save}
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        Save
      </Button>
    </li>
  );
}
