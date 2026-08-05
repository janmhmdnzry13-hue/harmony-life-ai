import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getScoreHistory, listInsights } from "@/lib/intelligence.functions";
import { listFinance } from "@/lib/finance.functions";
import { listSleep } from "@/lib/health.functions";
import { listMood, listStress } from "@/lib/mind.functions";
import { listTasks } from "@/lib/tasks.functions";
import { listHabits } from "@/lib/habits.functions";
import { listEvents } from "@/lib/events.functions";
import { Sparkline } from "@/components/score-ring";
import { BookOpen, Gauge, Heart, Wallet } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { findConnections, spendRatio } from "@/lib/connections";
import { haptic } from "@/lib/feel";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Origin Life OS" },
      { name: "description", content: "How your sleep, money, habits and mood shape one another over time." },
      { property: "og:title", content: "Insights — Origin Life OS" },
      {
        property: "og:description",
        content: "How your sleep, money, habits and mood shape one another over time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const historyFn = useServerFn(getScoreHistory);
  const insightsFn = useServerFn(listInsights);
  const financeFn = useServerFn(listFinance);
  const sleepFn = useServerFn(listSleep);
  const moodFn = useServerFn(listMood);
  const stressFn = useServerFn(listStress);
  const tasksFn = useServerFn(listTasks);
  const habitsFn = useServerFn(listHabits);
  const eventsFn = useServerFn(listEvents);

  const history = useQuery({ queryKey: ["score-history"], queryFn: () => historyFn() });
  const insights = useQuery({ queryKey: ["insights"], queryFn: () => insightsFn() });
  const finance = useQuery({ queryKey: ["finance"], queryFn: () => financeFn() });
  const sleep = useQuery({ queryKey: ["sleep"], queryFn: () => sleepFn() });
  const mood = useQuery({ queryKey: ["mood"], queryFn: () => moodFn() });
  const stress = useQuery({ queryKey: ["stress"], queryFn: () => stressFn() });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => tasksFn() });
  const habitsQ = useQuery({ queryKey: ["habits"], queryFn: () => habitsFn() });
  const events = useQuery({ queryKey: ["events"], queryFn: () => eventsFn() });

  const rows = history.data ?? [];
  const latest = rows[rows.length - 1];
  const life = Math.round(Number(latest?.life_score ?? 0));
  const points = rows.map((r) => Number(r.life_score ?? 0));
  const prev = rows.length > 7 ? Number(rows[rows.length - 8]?.life_score ?? 0) : null;
  const delta = prev !== null && life ? Math.round(life - prev) : null;

  const month = new Date().toISOString().slice(0, 7);
  const tx = (finance.data?.transactions ?? []).filter((t) => t.occurred_on.slice(0, 7) === month);
  const spent = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const earned = tx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

  const today = format(new Date(), "yyyy-MM-dd");
  const habits = habitsQ.data?.habits ?? [];
  const logs = habitsQ.data?.logs ?? [];
  const doneToday = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.log_date === today)).length;
  const open = (tasks.data ?? []).filter((t) => !t.completed).length;
  const sleepHours = (sleep.data ?? [])[0]?.duration_min ? Number((sleep.data ?? [])[0]!.duration_min) / 60 : null;
  const moodAvg = avg((mood.data ?? []).slice(0, 7).map((m) => Number(m.mood)));
  const stressNow = (stress.data ?? [])[0]?.level ?? null;
  const eventsToday = (events.data ?? []).filter((e) => isToday(parseISO(e.starts_at))).length;

  const links = findConnections({
    sleepHours,
    stress: stressNow === null ? null : Number(stressNow),
    mood: moodAvg,
    openTasks: open,
    habitsDone: doneToday,
    habitsTotal: habits.length,
    eventsToday,
    spent,
    earned,
    recentSpendRatio: spendRatio(tx),
  }).slice(0, 3);

  const bars = [
    { label: "Health", value: Number(latest?.health_score ?? 0) },
    { label: "Money", value: Number(latest?.finance_score ?? 0) },
    { label: "Focus", value: Number(latest?.productivity_score ?? 0) },
    { label: "Joy", value: Number(latest?.happiness_score ?? 0) },
  ];

  return (
    <div className="space-y-4 px-5 pb-4 pt-8">
      <header className="rise px-1 pb-2">
        <p className="label-quiet">Insights</p>
        <h1 className="mt-2 font-serif text-[34px] leading-tight tracking-tight">How life is going.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          One picture, drawn from every part of your life — not four separate reports.
        </p>
      </header>

      {/* Life score */}
      <section className="card-soft rise p-6">
        <p className="label-quiet">Life score</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="font-serif text-6xl leading-none tracking-tight">{life || "—"}</span>
          <span className="pb-2 text-xs text-muted-foreground">
            {delta === null || delta === 0 ? "out of 100" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} this week`}
          </span>
        </div>
        <div className="mt-5">
          <Sparkline points={points} />
        </div>
        <div className="mt-6 space-y-3.5">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{b.label}</span>
                <span className="text-muted-foreground">{Math.round(b.value)}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${Math.max(0, Math.min(100, b.value))}%`,
                    transition: "width 900ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it connects — the heart of the Life OS idea */}
      {links.length > 0 && (
        <section className="card-soft rise p-6">
          <p className="label-quiet">How it connects</p>
          <ul className="mt-5 space-y-6">
            {links.map((l) => (
              <li key={`${l.from}-${l.to}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wide">{l.from}</span>
                  <span className="h-px w-6 bg-border" />
                  <span className="text-[11px] font-semibold tracking-wide">{l.to}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.line}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* This month */}
      <section className="card-soft rise p-6">
        <p className="label-quiet">This month</p>
        <p className="mt-3 font-serif text-2xl">
          {earned - spent >= 0 ? "+" : "−"}
          {Math.abs(Math.round(earned - spent)).toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          net across {tx.length} entries · {Math.round(spent).toLocaleString()} spent
        </p>
      </section>

      {/* Recommendations */}
      {(insights.data ?? []).length > 0 && (
        <section className="card-soft rise p-6">
          <p className="label-quiet">Origin suggests</p>
          <ul className="mt-4 space-y-5">
            {(insights.data ?? []).slice(0, 4).map((i) => (
              <li key={i.id}>
                <p className="text-[15px] font-medium leading-snug">{i.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{i.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[
          { to: "/wellness", label: "Health", icon: Heart },
          { to: "/finance", label: "Money", icon: Wallet },
          { to: "/wellness/learn", label: "Learning", icon: BookOpen },
          { to: "/intel", label: "Intelligence", icon: Gauge },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to as never}
              onClick={() => haptic("tap")}
              className="press card-soft rise p-5"
            >
              <Icon className="size-4 text-accent" strokeWidth={1.9} />
              <p className="mt-3 font-serif text-lg">{c.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function avg(a: number[]) {
  const clean = a.filter((n) => Number.isFinite(n));
  return clean.length ? clean.reduce((s, n) => s + n, 0) / clean.length : null;
}
