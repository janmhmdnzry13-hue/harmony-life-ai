import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowUp, ArrowLeft, Mic, MicOff, Volume2, VolumeX, Gauge } from "lucide-react";
import { useVoice } from "@/hooks/use-voice";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "Origin — Your AI life assistant" },
      {
        name: "description",
        content:
          "Talk or type to Origin: a proactive AI assistant with long-term memory and live context on your health, money, focus and mood.",
      },
      { property: "og:title", content: "Origin — Your AI life assistant" },
      {
        property: "og:description",
        content: "Voice-first AI assistant with durable memory and full life context.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiPage,
});

const SUGGESTIONS = [
  "Add a task: call the bank tomorrow",
  "I did my walk today",
  "Plan my day",
  "How am I actually doing?",
  "Am I heading for burnout?",
  "What should I drop this week?",
];

function AiPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    headers: (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport,
    onFinish: ({ message }: { message: UIMessage }) => {
      const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
      speak(text);
      // Origin can create/complete tasks and log habits for real — refresh the
      // shared views so Plan, Habits and Home show the change immediately.
      for (const key of ["tasks", "habits", "dashboard", "insights", "understand"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      inputRef.current?.focus();
    },
  });

  const voice = useVoice((text) => {
    sendMessage({ text });
    setInput("");
  });
  const { speak } = voice;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text });
    setInput("");
    inputRef.current?.focus();
  };

  const busy = status === "streaming" || status === "submitted";

  const goBack = () => {
    if (router.history.canGoBack()) router.history.back();
    else router.navigate({ to: "/" });
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-paper">
      <header className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="press grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div
            className="grid size-9 place-items-center rounded-full p-[2px]"
            style={{ background: "conic-gradient(from 200deg, var(--amber), var(--accent), var(--sky), var(--amber))" }}
          >
            <span className="grid size-full place-items-center rounded-full bg-card">
              <Sparkles className="size-4 text-accent" />
            </span>
          </div>
          <div>
            <h2 className="font-serif text-lg">Origin</h2>
            <p className="text-[10px] tracking-widest uppercase text-ink/40">
              {voice.listening ? "Listening…" : busy ? "Thinking…" : "Memory + context on"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (voice.speakReplies) voice.silence();
              voice.setSpeakReplies(!voice.speakReplies);
            }}
            aria-label={voice.speakReplies ? "Mute spoken replies" : "Speak replies aloud"}
            className={`press grid size-9 place-items-center rounded-xl border ${
              voice.speakReplies ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground"
            }`}
          >
            {voice.speakReplies ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <Link
            to="/intel"
            aria-label="Life score"
            className="press grid size-9 place-items-center rounded-xl border border-border text-muted-foreground"
          >
            <Gauge className="size-4" />
          </Link>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 pb-28 space-y-5">
        {messages.length === 0 && (
          <div className="pt-8 rise">
            <p className="font-serif italic text-2xl leading-snug text-ink/80 mb-2 text-balance">
              What would you like to work through today?
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Ask me to add a task, log a habit or review your week — I change the real thing, not a copy.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="press rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === "user";
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          return (
            <div key={m.id} className={isUser ? "flex justify-end rise" : "rise"}>
              {isUser ? (
                <div className="max-w-[85%] rounded-[18px] rounded-br-[5px] bg-accent px-4 py-2.5 text-sm text-accent-foreground">
                  {text}
                </div>
              ) : (
                <div className="max-w-[92%] text-sm leading-relaxed whitespace-pre-wrap font-serif">{text}</div>
              )}
            </div>
          );
        })}

        {voice.transcript && (
          <div className="flex justify-end">
            <div className="max-w-[85%] border border-accent/40 text-ink/60 px-4 py-2.5 text-sm italic">
              {voice.transcript}
            </div>
          </div>
        )}

        {status === "submitted" && <div className="text-sm text-ink/40 font-serif italic">Thinking…</div>}
      </div>

      <div className="fixed bottom-0 inset-x-0 flex justify-center pointer-events-none pb-5">
        <form
          className="w-full max-w-[480px] px-5 pointer-events-auto"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex items-center gap-2 glass rounded-full pl-4 pr-2 py-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={voice.listening ? "Listening…" : "Message or speak to Origin…"}
              className="flex-1 bg-transparent text-sm py-1.5 focus:outline-none"
              disabled={busy}
            />
            {voice.supported && (
              <button
                type="button"
                onClick={() => (voice.listening ? voice.stop() : voice.start())}
                aria-label={voice.listening ? "Stop listening" : "Speak to Origin"}
                className={`grid size-8 place-items-center rounded-full border ${
                  voice.listening ? "bg-accent text-accent-foreground border-accent listening" : "border-border text-muted-foreground"
                }`}
              >
                {voice.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
            )}
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground disabled:opacity-40"
              aria-label="Send"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
