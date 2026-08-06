import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import { thoughtToAction, commitActions, type ThoughtAction } from "@/lib/understand.functions";
import { useVoice } from "@/hooks/use-voice";
import { haptic } from "@/lib/feel";
import { useCelebrate } from "@/components/celebration";

export const Route = createFileRoute("/_authenticated/capture")({
  head: () => ({
    meta: [
      { title: "Capture a thought — Origin Life OS" },
      {
        name: "description",
        content: "Speak or type anything on your mind and Origin turns it into clear next steps in seconds.",
      },
      { property: "og:title", content: "Capture a thought — Origin Life OS" },
      {
        property: "og:description",
        content: "Speak or type anything on your mind and Origin turns it into clear next steps in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CapturePage,
});

function CapturePage() {
  const qc = useQueryClient();
  const celebrate = useCelebrate();
  const thinkFn = useServerFn(thoughtToAction);
  const commitFn = useServerFn(commitActions);

  const [text, setText] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [actions, setActions] = useState<ThoughtAction[]>([]);
  const [chosen, setChosen] = useState<number[]>([]);

  const voice = useVoice((final) => setText((t) => (t ? `${t} ${final}` : final)));

  const think = useMutation({
    mutationFn: (value: string) => thinkFn({ data: { text: value } }),
    onSuccess: (r) => {
      setSummary(r.summary);
      setActions(r.actions);
      setChosen(r.actions.map((_, i) => i));
      haptic("soft");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const commit = useMutation({
    mutationFn: (picked: ThoughtAction[]) => commitFn({ data: { actions: picked } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      celebrate(r.count === 1 ? "Added. It's out of your head now." : `${r.count} steps added. Nothing left to hold.`);
      setText("");
      setSummary(null);
      setActions([]);
      setChosen([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5 px-5 pb-4 pt-8">
      <header className="rise px-1">
        <p className="label-quiet">Capture</p>
        <h1 className="mt-2 font-serif text-[32px] leading-tight tracking-tight">Say it, and let it go.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A thought, a worry, a half-formed idea. Origin will turn it into something you can actually do.
        </p>
      </header>

      <section className="card-soft rise p-5">
        <textarea
          value={voice.listening && voice.transcript ? `${text} ${voice.transcript}`.trim() : text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="I keep thinking about…"
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-4 flex items-center gap-2.5">
          {voice.supported && (
            <button
              onClick={() => {
                haptic("tap");
                voice.listening ? voice.stop() : voice.start();
              }}
              aria-label={voice.listening ? "Stop listening" : "Speak"}
              className={`press grid size-11 shrink-0 place-items-center rounded-xl ${
                voice.listening ? "bg-accent text-accent-foreground" : "border border-border"
              }`}
            >
              {voice.listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>
          )}
          <button
            onClick={() => {
              haptic("tap");
              if (text.trim().length < 3) return toast.error("A few more words and I'll have something to work with.");
              think.mutate(text.trim());
            }}
            disabled={think.isPending}
            className="press flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            {think.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {think.isPending ? "Thinking it through…" : "Turn into next steps"}
          </button>
        </div>
        {voice.listening && (
          <p className="mt-3 text-xs text-muted-foreground">Listening — take your time.</p>
        )}
      </section>

      {summary && (
        <section className="card-soft bloom p-6">
          <p className="label-quiet">What I heard</p>
          <p className="mt-3 font-serif text-lg leading-snug">{summary}</p>

          {actions.length > 0 && (
            <>
              <p className="label-quiet mt-7">Next steps</p>
              <ul className="mt-4 space-y-2.5">
                {actions.map((a, i) => {
                  const on = chosen.includes(i);
                  return (
                    <li key={`${a.title}-${i}`}>
                      <button
                        onClick={() => {
                          haptic("tap");
                          setChosen((c) => (on ? c.filter((x) => x !== i) : [...c, i]));
                        }}
                        className={`press flex w-full items-start gap-3 rounded-xl border p-4 text-left ${
                          on ? "border-accent/60 bg-surface" : "border-border"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${
                            on ? "border-accent bg-accent text-accent-foreground" : "border-border"
                          }`}
                        >
                          {on && <Check className="size-3" strokeWidth={2.6} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[15px] font-medium leading-snug">{a.title}</span>
                          {a.note && (
                            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{a.note}</span>
                          )}
                          {a.due_date && (
                            <span className="mt-1 block text-xs text-muted-foreground">by {a.due_date}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                onClick={() => {
                  haptic("tap");
                  const picked = chosen.map((i) => actions[i]!).filter(Boolean);
                  if (picked.length === 0) return toast.error("Pick at least one step to keep.");
                  commit.mutate(picked);
                }}
                disabled={commit.isPending}
                className="press mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground disabled:opacity-60"
              >
                {commit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Add to my tasks
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
