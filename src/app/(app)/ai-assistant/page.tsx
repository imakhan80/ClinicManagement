import { PageHeader } from "@/components/page-header";
import { ChatPanel } from "@/components/ai-assistant/chat-panel";

export default function AiAssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="A read-only assistant for clinic operations questions — not a clinical tool."
      />
      <ChatPanel />
    </div>
  );
}
