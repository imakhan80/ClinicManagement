import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { QueueBoard } from "@/components/queue/queue-board";

export default async function QueuePage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("queue_entries")
    .select("id, appointment_id, queue_number, priority, status, checked_in_at, patients(full_name)")
    .in("status", ["waiting", "triaged", "ready", "in_consult"])
    .order("queue_number", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live queue"
        description="Real-time view of patients moving through check-in, triage, and consultation."
      />
      <QueueBoard initial={entries ?? []} role={user!.role} />
    </div>
  );
}
