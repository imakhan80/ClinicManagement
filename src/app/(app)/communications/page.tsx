import { MessageSquare, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { NewTemplateDialog } from "@/components/communications/new-template-dialog";
import { LogCommunicationDialog } from "@/components/communications/log-communication-dialog";
import { formatRelative } from "@/lib/format";

const CHANNEL_LABEL: Record<string, string> = {
  call: "Call",
  sms: "SMS",
  email: "Email",
  in_person: "In person",
};

export default async function CommunicationsPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const canManage = user?.role === "admin" || user?.role === "receptionist";

  const [{ data: templates }, { data: logs }] = await Promise.all([
    supabase.from("communication_templates").select("*").order("name"),
    supabase
      .from("communication_logs")
      .select("id, channel, direction, subject, body, created_at, patients(full_name), logged_by:profiles!logged_by(full_name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Communications"
        description="Log patient contact and manage reusable message templates."
        actions={canManage ? <LogCommunicationDialog /> : undefined}
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold">Recent activity</h2>
        {!logs || logs.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No communications logged yet" />
        ) : (
          <Card className="gap-0 overflow-hidden p-0 shadow-sm">
            <ul className="divide-y divide-border">
              {logs.map((log) => {
                const patient = Array.isArray(log.patients) ? log.patients[0] : log.patients;
                const staff = Array.isArray(log.logged_by) ? log.logged_by[0] : log.logged_by;
                return (
                  <li key={log.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        {patient?.full_name ?? "Unknown"}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {CHANNEL_LABEL[log.channel]} · {log.direction}
                        </span>
                      </p>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {staff?.full_name ? `${staff.full_name} · ` : ""}
                        {formatRelative(log.created_at)}
                      </p>
                    </div>
                    {log.subject && <p className="mt-0.5 text-sm font-medium">{log.subject}</p>}
                    <p className="mt-0.5 text-sm text-muted-foreground">{log.body}</p>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Templates</h2>
          {user?.role === "admin" && <NewTemplateDialog />}
        </div>
        {!templates || templates.length === 0 ? (
          <EmptyState icon={FileText} title="No templates yet" />
        ) : (
          <Card className="gap-0 overflow-hidden p-0 shadow-sm">
            <ul className="divide-y divide-border">
              {templates.map((t) => (
                <li key={t.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{t.name}</p>
                    <span className="text-xs text-muted-foreground">{CHANNEL_LABEL[t.channel]}</span>
                  </div>
                  {t.subject && <p className="text-xs text-muted-foreground">{t.subject}</p>}
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.body}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
