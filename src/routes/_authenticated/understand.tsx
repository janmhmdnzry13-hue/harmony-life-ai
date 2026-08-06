import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BatteryLow,
  CloudRain,
  Compass,
  Flame,
  Layers,
  Loader2,
  Radar,
  ShieldAlert,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { getUnderstanding, explainFriction, runLifeAudit, listAudits } from "@/lib/understand.functions";
import { CardSkeleton, EmptyState } from "@/components/soft";
import { haptic } from "@/lib/feel";

export const Route = createFileRoute("/_authenticated/understand")({
  head: () => ({
    meta: [
      { title: "Understand — Origin Life OS" },
      {
        name: "description",
        content:
          "Origin reads your whole life and explains what is actually holding you back, what happens if nothing changes, and the one thing to do next.",
      },
      { property: "og:title", content: "Understand — Origin Life OS" },
      {
        property: "og:description",
        content: "Life friction, future risk, self-sabotage patterns and the life graph — explained in plain language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UnderstandPage,
});

const KIND_ICON = {
  energy: BatteryLow,
  time: Layers,
  stress: CloudRain,
  money: Wallet,
  habits: Radar,
  decisions: Compass,
  goals: Target,
  clarity: Sparkles,
} as const;

function UnderstandPage() {
  const understandFn = useServerFn(getUnderstanding);
  const explainFn = useServerFn(explainFriction);
  const auditFn = useServerFn(runLifeAudit);
  const auditsFn = useServerFn(listAudits);

  const u = useQuery({ queryKey: ["understanding"], queryFn: () => understandFn() });
  const audits = useQuery({ queryKey: ["audits"], queryFn: () => auditsFn() });
  const [explanation, setExplanation] = useState<string | null>(null);
  const [audit, setAudit] = useState<string | null>(null);

  const explain = useMutation({
    mutationFn: () => explainFn(),
    onSuccess: (r) => {
      setExplanation(r.text);
      haptic("soft");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const makeAudit = useMutation({
    mutationFn: () => auditFn(),
    onSuccess: (r) => {
      setAudit(r.body_md);
      audits.refetch();
      haptic("success");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const d = u.data;
  const lastAudit = audit ?? audits.data?.[0]?.body_md ?? null;

  return (
    <div className="space-y-4 px-5 pb-4 pt-8">
      <header className="rise px-1 pb-2">
        <p className="label-quiet">Understand</p>
        <h1 className="mt-2 font-serif text-[34px] leading-tight tracking-tight">Why things feel the way they do.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Origin reads every part of your life together — not to grade you, but to find the one thing worth changing.
        </p>
      </header>

      {u.isLoading && (
        <>
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </>
      )}

      {d && (
        <>
          {/* Rescue entry — always one tap away */}
          <Link
            to="/rescue"
            onClick={() => haptic("tap")}
            className="press card-soft rise flex items-center justify-between p-5"
          >
            <div>
              <p className="label-quiet">Heavy day?</p>
              <p className="mt-1.5 font-serif text-lg">Rescue mode</p>
              <p className="mt-1 text-xs text-muted-foreground">Three things only. Everything else hidden.</p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" strokeWidth={1.8} />
          </Link>

          {/* Life friction */}
          <section className="card-soft rise p-6">
            <p className="label-quiet">What's in the way</p>
            {d.friction.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Nothing is clearly holding you back right now. Keep the week roughly as it is.
              </p>
            ) : (
              <ul className="mt-5 space-y-7">
                {d.friction.map((f) => {
                  const Icon = KIND_ICON[f.kind];
                  return (
                    <li key={f.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="size-[15px] text-accent" strokeWidth={1.9} />
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {f.kind}
                        </span>
                      </div>
                      <p className="mt-2 text-[15px] font-medium leading-snug">{f.title}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.why}</p>
                      <p className="mt-2.5 text-sm leading-relaxed">{f.move}</p>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              onClick={() => {
                haptic("tap");
                explain.mutate();
              }}
              disabled={explain.isPending}
              className="press mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              {explain.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {explain.isPending ? "Reading your life…" : "Ask Origin why"}
            </button>
            {explanation && (
              <div className="bloom mt-5 space-y-3 border-t border-border pt-5">
                {explanation.split(/\n{2,}/).map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </section>

          {/* Burnout predictor */}
          <section className="card-soft rise p-6">
            <p className="label-quiet">Burnout forecast</p>
            <div className="mt-3 flex items-end gap-3">
              <span className="font-serif text-5xl leading-none tracking-tight">{d.burnout.score}</span>
              <span className="pb-1.5 text-xs text-muted-foreground">
                risk out of 100 · {d.burnout.window}
              </span>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${d.burnout.score}%`, transition: "width 900ms cubic-bezier(0.22,1,0.36,1)" }}
              />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {d.burnout.drivers.length
                ? `Built from ${d.burnout.drivers.slice(0, 3).join(", ")}. Nothing here is permanent — one input usually moves the rest.`
                : "Nothing is pushing this up right now. Rest is doing its job."}
            </p>
          </section>

          {/* Future risk preview */}
          <section className="card-soft rise p-6">
            <p className="label-quiet">If nothing changes</p>
            {d.risks.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                No trend is heading anywhere you wouldn't want. That's a good place to be.
              </p>
            ) : (
              <ul className="mt-5 space-y-6">
                {d.risks.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-medium leading-snug">{r.headline}</p>
                      <span className="ml-3 shrink-0 text-[11px] text-muted-foreground">{r.horizon}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.ifNothingChanges}</p>
                    <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-accent/70" style={{ width: `${r.likelihood}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Self-sabotage radar */}
          <section className="card-soft rise p-6">
            <div className="flex items-center gap-2">
              <Radar className="size-4 text-accent" strokeWidth={1.9} />
              <p className="label-quiet">Patterns you might not see</p>
            </div>
            {d.patterns.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                No repeating pattern yet. A couple more weeks of logging and this gets interesting.
              </p>
            ) : (
              <ul className="mt-5 space-y-5">
                {d.patterns.map((p) => (
                  <li key={p.id}>
                    <p className="text-[15px] font-medium leading-snug">{p.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Money leaks */}
          <section className="card-soft rise p-6">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-accent" strokeWidth={1.9} />
              <p className="label-quiet">Where money leaks</p>
            </div>
            {d.leaks.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Nothing looks like a leak this month. Your spending is mostly chosen.
              </p>
            ) : (
              <>
                <p className="mt-3 font-serif text-3xl leading-none tracking-tight">
                  ~{d.leakTotal.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">a month you could likely keep</p>
                <ul className="mt-5 space-y-5">
                  {d.leaks.map((l) => (
                    <li key={l.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[15px] font-medium leading-snug">{l.label}</p>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {l.monthly.toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{l.detail}</p>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/finance"
                  onClick={() => haptic("tap")}
                  className="press mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent"
                >
                  Open money <ArrowRight className="size-3.5" />
                </Link>
              </>
            )}
          </section>

          {/* Goal conflicts */}
          {d.goalConflicts.length > 0 && (
            <section className="card-soft rise p-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-accent" strokeWidth={1.9} />
                <p className="label-quiet">Goals pulling against each other</p>
              </div>
              <ul className="mt-5 space-y-5">
                {d.goalConflicts.map((c) => (
                  <li key={c.title}>
                    <p className="text-[15px] font-medium leading-snug">{c.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.detail}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Life graph */}
          <section className="card-soft rise p-6">
            <p className="label-quiet">Your life graph</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cause and effect, as your own data shows it.
            </p>
            <ul className="mt-6 space-y-6">
              {d.graph.map((e) => (
                <li key={`${e.from}-${e.to}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold tracking-wide">{e.from}</span>
                    <span className="h-px flex-1 bg-border" />
                    <span
                      className="size-1.5 rounded-full bg-accent"
                      style={{ opacity: 0.35 + (e.strength / 100) * 0.65 }}
                    />
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-semibold tracking-wide">{e.to}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.line}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Weekly life audit */}
          <section className="card-soft rise p-6">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-accent" strokeWidth={1.9} />
              <p className="label-quiet">Weekly life audit</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A short, honest read on the last seven days — what improved, what slipped, and one thing worth trying.
            </p>
            <button
              onClick={() => {
                haptic("tap");
                makeAudit.mutate();
              }}
              disabled={makeAudit.isPending}
              className="press mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium disabled:opacity-60"
            >
              {makeAudit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {makeAudit.isPending ? "Reviewing your week…" : lastAudit ? "Run a fresh audit" : "Run this week's audit"}
            </button>
            {lastAudit && (
              <div className="bloom mt-5 space-y-3 border-t border-border pt-5">
                {lastAudit.split("\n").filter(Boolean).map((line, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                    {line.replace(/^\*\*(.+?)\*\*:?\s*/, "")
                      ? line.startsWith("**")
                        ? line.replace(/\*\*/g, "")
                        : line.replace(/\*\*/g, "")
                      : line}
                  </p>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {u.isError && (
        <EmptyState
          title="Origin couldn't read your life just now"
          body="Give it another moment — nothing was lost."
          action={
            <button onClick={() => u.refetch()} className="press rounded-xl border border-border px-4 py-2 text-sm">
              Try again
            </button>
          }
        />
      )}
    </div>
  );
}
