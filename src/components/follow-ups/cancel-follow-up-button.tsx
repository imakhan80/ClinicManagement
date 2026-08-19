"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelFollowUp } from "@/actions/follow-ups";

export function CancelFollowUpButton({ followUpId }: { followUpId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await cancelFollowUp(followUpId);
          router.refresh();
        })
      }
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
      Cancel
    </Button>
  );
}
