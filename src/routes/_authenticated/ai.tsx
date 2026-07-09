import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ai")({
  component: AiPage,
});

const SUGGESTIONS = [
  "Plan my day",
  "How do I stay focused?",
  "Reflect on my week",
  "Suggest a new habit",
];

function AiPage() {
  const [token, setToken] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    headers: () => (token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const { messages, sendMessage, status } = useChat({ transport });
  const [input, setInput] = useState("");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const send = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text });
    setInput("");
  };

  const busy = status === "streaming" || status === "submitted";

  return (
    <div className="flex flex-col h-[100dvh] pb-24">
      <header className="px-5 pt-12 pb-4 border-b border-ink/10">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-ink text-paper flex items-center justify-center">
            <Sparkles className="size-4 text-accent" />
          </div>
          <div>
            <h2 className="font-serif text-lg">Origin</h2>
            <p className="text-[10px] tracking-widest uppercase text-ink/40">
              {busy ? "Thinking…" : "Ready to assist"}
            </p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="pt-8">
            <p className="font-serif italic text-2xl leading-snug text-ink/80 mb-2 text-balance">
              What would you like to work through today?
            </p>
            <p className="text-sm text-ink/50 mb-6">
              I know your tasks, habits, and mood. Ask anything.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-2 border border-ink/15 hover:bg-surface"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === "user";
          const text = m.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("");
          return (
            <div key={m.id} className={isUser ? "flex justify-end" : ""}>
              {isUser ? (
                <div className="max-w-[85%] bg-accent text-accent-foreground px-4 py-2.5 text-sm">
                  {text}
                </div>
              ) : (
                <div className="max-w-[92%] text-sm leading-relaxed whitespace-pre-wrap font-serif">
                  {text}
                </div>
              )}
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="text-sm text-ink/40 font-serif italic">Thinking…</div>
        )}
      </div>

      <div className="fixed bottom-24 inset-x-0 flex justify-center pointer-events-none">
        <form
          className="w-full max-w-[480px] px-5 pointer-events-auto"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex items-center gap-2 bg-surface border border-ink/10 pl-4 pr-2 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Origin…"
              className="flex-1 bg-transparent text-sm py-1.5 focus:outline-none"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="size-8 bg-ink text-paper flex items-center justify-center disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
