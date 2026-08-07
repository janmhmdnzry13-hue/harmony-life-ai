import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/profile.functions";
import { listTasks, toggleTask } from "@/lib/tasks.functions";
import { listHabits, toggleHabitLog } from "@/lib/habits.functions";
import { listEvents } from "@/lib/events.functions";
import { listFinance } from "@/lib/finance.functions";
import { listSleep } from "@/lib/health.functions";
import { listMood, listStress } from "@/lib/mind.functions";
import { getScoreHistory, listInsights } from "@/lib/intelligence.functions";
import { format, parseISO, isToday } from "date-fns";
import { ArrowRight, Check, Clock, Sparkles } from "lucide-react";
import { greeting, dayline, haptic, praise } from "@/lib/feel";
import { useCelebrate } from "@/components/celebration";
import { CardSkeleton } from "@/components/soft";
import { spendRatio, topConnection } from "@/lib/connections";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Today — Origin Life OS" },
      { name: "description", content: "One calm view of your focus, your day and how the rest of life connects to it." },
      { property: "og:title", content: "Today — Origin Life OS" },
      {
        property: "og:description",
        content: "One calm view of your focus, your day and how the rest of life connects to it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const celebrate = useCelebrate();
  const profileFn = useServerFn(getProfile);
  const tasksFn = useServerFn(listTasks);
  const habitsFn = useServerFn(listHabits);
  const eventsFn = useServerFn(listEvents);
  const financeFn = useServerFn(listFinance);
  const sleepFn = useServerFn(listSleep);
  const moodFn = useServerFn(listMood);
  const stressFn = useServerFn(listStress);
  const insightsFn = useServerFn(listInsights);
  const historyFn = useServerFn(getScoreHistory);
  const toggleFn = useServerFn(toggleTask);
  const logHabitFn = useServerFn(toggleHabitLog);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => tasksFn() });
  const habitsQ = useQuery({ queryKey: ["habits"], queryFn: () => habitsFn() });
  const events = useQuery({ queryKey: ["events"], queryFn: () => eventsFn() });
  const finance = useQuery({ queryKey: ["finance"], queryFn: () => financeFn() });
  const sleep = useQuery({ queryKey: ["sleep"], queryFn: () => sleepFn() });
  const mood = useQuery({ queryKey: ["mood"], queryFn: () => moodFn() });
  const stress = useQuery({ queryKey: ["stress"], queryFn: () => stressFn() });
  const insights = useQuery({ queryKey: ["insights"], queryFn: () => insightsFn() });
  const history = useQuery({ queryKey: ["score-history"], queryFn: () => historyFn() });

  const toggle = useMutation({
    mutationFn: (v: { id: string; completed: boolean }) => toggleFn({ data: v }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      if (v.completed) celebrate(praise.task());
    },
  });
  const logHabit = useMutation({
    mutationFn: (v: { habit_id: string; log_date: string; wasDone: boolean }) =>
      logHabitFn({ data: { habit_id: v.habit_id, log_date: v.log_date } }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      if (!v.wasDone) celebrate(praise.habit());
    },
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const open = (tasks.data ?? []).filter((t) => !t.completed);
  const focus = open.find((t) => t.priority === "high") ?? open[0];
  const nextAction = open.find((t) => t.id !== focus?.id);
  const nextEvent = (events.data ?? []).find((e) => new Date(e.starts_at) >= new Date());
  const eventsToday = (events.data ?? []).filter((e) => isToday(parseISO(e.starts_at))).length;

  const habits = habitsQ.data?.habits ?? [];
  const logs = habitsQ.data?.logs ?? [];
  const doneToday = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.log_date === today));
  const habitPct = habits.length ? Math.round((doneToday.length / habits.length) * 100) : 0;

  const monthTx = finance.data?.transactions ?? [];
  const monthKey = today.slice(0, 7);
  const inMonth = monthTx.filter((t) => t.occurred_on.slice(0, 7) === monthKey);
  const spent = inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const earned = inMonth.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);

  const lastSleep = (sleep.data ?? [])[0];
  const sleepHours = lastSleep?.duration_min ? lastSleep.duration_min / 60 : null;
  const moodAvg = avg((mood.data ?? []).slice(0, 7).map((m) => Number(m.mood)));
  const stressNow = (stress.data ?? [])[0]?.level ?? null;

  const scores = (history.data ?? [])[(history.data ?? []).length - 1];
  const rings = [
    { label: "Health", value: num(scores?.health_score), to: "/wellness" },
    { label: "Money", value: num(scores?.finance_score), to: "/finance" },
    { label: "Focus", value: num(scores?.productivity_score), to: "/plan" },
    { label: "Joy", value: num(scores?.happiness_score), to: "/wellness/mind" },
  ];
  const lifeScore = num(scores?.life_score);

  // The one link between modules worth surfacing today.
  const link = topConnection({
    sleepHours,
    stress: stressNow === null ? null : Number(stressNow),
    mood: moodAvg,
    energy: profile.data?.energy_level ?? null,
    openTasks: open.length,
    habitsDone: doneToday.length,
    habitsTotal: habits.length,
    eventsToday,
    spent,
    earned,
    recentSpendRatio: spendRatio(inMonth),
  });

  const recommendation = (insights.data ?? []).find((i) => i.kind === "recommendation");
  const aiInsight = (insights.data ?? []).find((i) => i.id !== recommendation?.id);

  const name = (profile.data?.display_name ?? "friend").split(" ")[0];
  const loading = tasks.isLoading || habitsQ.isLoading;

  const doneTasks = (tasks.data ?? []).filter((t) => t.completed).length;
  const totalTasks = (tasks.data ?? []).length;

  return (
    <div className="space-y-4 px-5 pb-4 pt-7">
      <header className="rise px-1 pb-1">
        <p className="label-quiet">{format(new Date(), "EEEE, MMMM d")}</p>
        <h1 className="mt-2 font-serif text-[32px] leading-[1.15] tracking-tight">
          {greeting()}, {name}.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {dayline(open.length, doneToday.length, habits.length)}
        </p>
      </header>

      {/* At a glance — four questions, four answers */}
      <div className="grid grid-cols-2 gap-3">
        <Tile
          to="/insights"
          label="Life score"
          value={lifeScore ? String(lifeScore) : "—"}
          note="across every area"
          tone="accent"
        />
        <Tile
          to="/tasks"
          label="Tasks done"
          value={`${doneTasks}/${totalTasks || 0}`}
          note={open.length ? `${open.length} still open` : "all clear"}
          tone="sky"
        />
        <Tile
          to="/habits"
          label="Habits"
          value={`${habitPct}%`}
          note={`${doneToday.length} of ${habits.length || 0} today`}
          tone="leaf"
        />
        <Tile
          to="/wellness"
          label="Rest"
          value={sleepHours ? `${sleepHours.toFixed(1)}h` : "—"}
          note={stressNow !== null ? `stress ${Number(stressNow)}/10` : "last night"}
          tone="amber"
        />
      </div>

      {/* Quick actions — fewer clicks to the things done most */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-0.5 py-0.5">
        {[
          { to: "/capture", label: "Capture" },
          { to: "/tasks", label: "Add task" },
          { to: "/calendar", label: "Calendar" },
          { to: "/finance", label: "Money" },
          { to: "/rescue", label: "Rescue" },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to as never}
            onClick={() => haptic("tap")}
            className="press shrink-0 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold"
          >
            {a.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </div>
      ) : (
        <>

          {/* Today's focus — the single primary action on the screen */}
          <section className="card-soft rise p-6">
            <p className="label-quiet">Today's focus</p>
            {focus ? (
              <>
                <h2 className="mt-3 font-serif text-2xl leading-snug">{focus.title}</h2>
                {focus.tag && <p className="mt-1.5 text-sm text-muted-foreground">{focus.tag}</p>}
                <button
                  onClick={() => {
                    haptic("soft");
                    toggle.mutate({ id: focus.id, completed: true });
                  }}
                  className="press mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
                >
                  <Check className="size-4" strokeWidth={2.4} /> I've done this
                </button>
              </>
            ) : (
              <>
                <h2 className="mt-3 font-serif text-2xl leading-snug">Nothing pressing.</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  A rare kind of quiet. You're allowed to enjoy it.
                </p>
                <Link
                  to="/tasks"
                  className="press mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
                >
                  Add something <ArrowRight className="size-4" />
                </Link>
              </>
            )}
          </section>

          {/* Next action + upcoming event — one quiet timeline */}
          <section className="card-soft rise p-6">
            <div className="flex items-center justify-between">
              <p className="label-quiet">Then</p>
              <Link to="/plan" onClick={() => haptic("tap")} className="text-xs font-semibold text-accent">
                Plan
              </Link>
            </div>
            <ul className="mt-4 space-y-4">
              {nextAction && (
                <li className="flex items-start gap-3.5">
                  <button
                    onClick={() => {
                      haptic("soft");
                      toggle.mutate({ id: nextAction.id, completed: true });
                    }}
                    aria-label={`Complete ${nextAction.title}`}
                    className="press mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-transparent active:text-accent"
                  >
                    <Check className="size-4" strokeWidth={2.4} />
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">{nextAction.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">next action</p>
                  </div>
                </li>
              )}
              {nextEvent && (
                <li className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-surface">
                    <Clock className="size-4 text-muted-foreground" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">{nextEvent.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format(parseISO(nextEvent.starts_at), "EEE h:mm a")}
                      {nextEvent.location ? ` · ${nextEvent.location}` : ""}
                    </p>
                  </div>
                </li>
              )}
              {!nextEvent && !nextAction && (
                <li className="text-sm leading-relaxed text-muted-foreground">
                  Nothing else scheduled. The day is yours to shape.
                </li>
              )}
            </ul>
          </section>

          {/* Life status — every module, one glance */}
          <section className="card-soft rise p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="label-quiet">Life status</p>
                <p className="mt-2 font-serif text-[40px] leading-none tracking-tight">
                  {lifeScore ? lifeScore : "—"}
                </p>
                <p className="mt-1.5 max-w-[24ch] text-xs leading-relaxed text-muted-foreground">
                  {lifeScore ? statusLine(lifeScore) : "Log a little of your day and this begins to take shape."}
                </p>
              </div>
              <Ring value={habitPct} caption={`${doneToday.length}/${habits.length || 0}`} label="habits" />
            </div>
            <div className="mt-6 grid grid-cols-4 gap-2">
              {rings.map((r) => (
                <Link
                  key={r.label}
                  to={r.to as never}
                  onClick={() => haptic("tap")}
                  className="press flex flex-col items-center gap-2"
                >
                  <MiniRing value={r.value} />
                  <span className="text-[10px] font-medium tracking-wide text-muted-foreground">{r.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* The connection — how one part of life is touching another */}
          {link && (
            <section className="card-soft rise p-6">
              <div className="flex items-center gap-2">
                <p className="label-quiet">{link.from}</p>
                <span className="h-px w-5 bg-border" />
                <p className="label-quiet">{link.to}</p>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">{link.line}</p>
              <Link
                to="/insights"
                onClick={() => haptic("tap")}
                className="press mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent"
              >
                See how it all connects <ArrowRight className="size-4" />
              </Link>
            </section>
          )}

          {/* One recommendation from Origin — quiet, never dominant */}
          <section className="card-soft rise p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-accent" strokeWidth={2} />
              <p className="label-quiet">A thought from Origin</p>
            </div>
            <p className="mt-3 font-serif text-lg italic leading-snug">
              {recommendation?.body ?? aiInsight?.body ?? buildInsight(open.length, profile.data?.energy_level ?? null)}
            </p>
            <button
              onClick={() => {
                haptic("tap");
                navigate({ to: "/ai" as never });
              }}
              className="press mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent"
            >
              Talk it through <ArrowRight className="size-4" />
            </button>
          </section>

          {/* Understand + capture — the quiet intelligence entry points */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/understand"
              onClick={() => haptic("tap")}
              className="press card-soft rise p-5"
            >
              <p className="label-quiet">Understand</p>
              <p className="mt-2 font-serif text-lg leading-snug">Why you're stuck</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Friction, patterns, what's ahead
              </p>
            </Link>
            <Link to="/capture" onClick={() => haptic("tap")} className="press card-soft rise p-5">
              <p className="label-quiet">Capture</p>
              <p className="mt-2 font-serif text-lg leading-snug">Say it, let it go</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                A thought becomes next steps
              </p>
            </Link>
          </div>
        </>
      )}
    </div>

  );
}

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function avg(a: number[]) {
  const clean = a.filter((n) => Number.isFinite(n));
  return clean.length ? clean.reduce((s, n) => s + n, 0) / clean.length : null;
}

function statusLine(score: number) {
  if (score >= 80) return "Life is running well right now. Hold the line, gently.";
  if (score >= 60) return "Steady overall — a few areas would like a little attention.";
  if (score >= 40) return "A mixed stretch. One area at a time is the way through.";
  return "It's been a heavy patch. Small and kind beats big and fast.";
}

function Ring({ value, caption, label }: { value: number; caption: string; label: string }) {
  const size = 76;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="shrink-0 text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6} className="stroke-surface" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (Math.max(0, Math.min(100, value)) / 100) * c}
            className="stroke-accent"
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-serif text-sm">{caption}</span>
      </div>
      <span className="mt-1.5 block text-[10px] tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

function MiniRing({ value }: { value: number }) {
  const size = 46;
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={4} className="stroke-surface" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.max(0, Math.min(100, value)) / 100) * c}
          className="stroke-accent"
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-medium">{value || "—"}</span>
    </div>
  );
}

function buildInsight(open: number, energy: number | null) {
  if (energy !== null && energy <= 1)
    return "Your energy reads low today. Pick one thing that matters and let the rest wait — that's enough.";
  if (open === 0) return "Nothing is pending. Rest counts as progress too.";
  if (open === 1) return "One thing left. Start it before you think about it too long.";
  return `You have ${open} open. Begin with the smallest one — momentum does the rest.`;
}
