"use client";

import { useRef, useState, useTransition } from "react";
import { Sparkles, Send, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { askAssistant, type AssistantMessage } from "@/actions/ai-assistant";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "How's today looking so far?",
  "Which invoices are overdue?",
  "Any medications or supplies low on stock?",
  "Who's on the follow-up list this week?",
];

export function ChatPanel() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  function send(question: string) {
    if (!question.trim() || isPending) return;
    setError(null);
    const nextMessages: AssistantMessage[] = [...messages, { role: "user", text: question }];
    setMessages(nextMessages);
    setInput("");
    startTransition(async () => {
      const result = await askAssistant(messages, question);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessages([...nextMessages, { role: "model", text: result.answer ?? "" }]);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
    });
  }

  return (
    <Card className="flex h-[70vh] flex-col gap-0 overflow-hidden p-0 shadow-sm">
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Ask about today&apos;s operations</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reads live data from the clinic — schedule, billing, and stock. Not for clinical advice.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg",
                  m.role === "user" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                )}
              >
                {m.role === "user" ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        {isPending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Thinking…
          </div>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the clinic…"
          className="h-10 flex-1 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </Card>
  );
}
