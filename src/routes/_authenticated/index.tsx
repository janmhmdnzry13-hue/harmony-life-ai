import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toggleTask } from "@/lib/tasks.functions";
import { getDashboardData } from "@/lib/dashboard.functions";
import { format, parseISO } from "date-fns";
import { ArrowRight, Check, Clock, ListChecks, Mic, Repeat, Sparkles, UserRound, Heart, Target, Sun, Flame, PencilLine, Plus, CalendarDays, CircleDollarSign, Circle } from "lucide-react";
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
  const dashboardFn = useServerFn(getDashboardData);
  const toggleFn = useServerFn(toggleTask);

  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardFn(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; completed: boolean }) => toggleFn({ data: v }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (v.completed) celebrate(praise.task());
    },
  });

  const data = dashboard.data;
  const openCount = data?.tasks.openCount ?? 0;
  const focus = data?.focusTask ?? null;
  const nextAction = data?.nextAction ?? null;
  const nextEvent = data?.upcomingEvents.find((e) => new Date(e.starts_at) >= new Date());
  const eventsToday = data?.eventsTodayCount ?? 0;

  const habits = data?.habits.items ?? [];
  const doneTodayCount = data?.habits.completedTodayCount ?? 0;
  const habitPct = data?.habits.completionPercentage ?? 0;

  const spent = data?.financeSummary.spent ?? 0;
  const earned = data?.financeSummary.earned ?? 0;
  const inMonth = data?.financeSummary.monthTransactions ?? [];

  const sleepHours = data?.sleepSummary.hours ?? null;
  const moodAvg = data?.moodSummary.average ?? null;
  const stressNow = data?.stressSummary.currentLevel ?? null;

  const scores = data?.latestLifeScore;
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
    energy: data?.profile?.energy_level ?? null,
    openTasks: openCount,
    habitsDone: doneTodayCount,
    habitsTotal: habits.length,
    eventsToday,
    spent,
    earned,
    recentSpendRatio: spendRatio(inMonth),
  });

  const recommendation = data?.importantInsights.find((i) => i.kind === "recommendation");
  const aiInsight = data?.importantInsights.find((i) => i.id !== recommendation?.id);

  const name = (data?.profile?.display_name ?? "friend").split(" ")[0];
  const loading = dashboard.isLoading;

  const doneTasks = data?.tasks.completedCount ?? 0;
  const totalTasks = data?.tasks.total ?? 0;
  const setupSteps = [
    {
      to: "/tasks",
      label: "Add your first task",
      detail: totalTasks ? `${totalTasks} task${totalTasks === 1 ? "" : "s"} added` : "Start with one small next step",
      done: totalTasks > 0,
      icon: ListChecks,
    },
    {
      to: "/habits",
      label: "Choose one habit",
      detail: habits.length ? `${habits.length} habit${habits.length === 1 ? "" : "s"} tracking` : "Pick a ritual under ten minutes",
      done: habits.length > 0,
      icon: Repeat,
    },
    {
      to: "/capture",
      label: "Capture what is on your mind",
      detail: "Turn loose thoughts into next steps",
      done: totalTasks > 0,
      icon: Mic,
    },
    {
      to: "/account",
      label: "Personalize your account",
      detail: data?.profile?.display_name ? `Welcome, ${name}` : "Add your name so Origin feels yours",
      done: Boolean(data?.profile?.display_name),
      icon: UserRound,
    },
  ];
  const setupComplete = setupSteps.every((step) => step.done);
  const showFirstRunSetup = !loading && !setupComplete && totalTasks < 3 && habits.length < 3;

  return (
    <div className="space-y-4 px-5 pb-4 pt-7">
      <h1 className="sr-only">Your day at Origin</h1>
      <section className="flex items-center gap-6 border-b border-border pb-8 pt-2" aria-label="Life score overview">
        <Link to="/insights" className="relative block w-[48%] shrink-0 aspect-square" aria-label={`Life score ${lifeScore}`}>
          <svg viewBox="0 0 160 160" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="80" cy="80" r="69" fill="none" strokeWidth="14" className="stroke-surface" />
            {rings.map((r, i) => <circle key={r.label} cx="80" cy="80" r="69" fill="none" strokeWidth="14" strokeLinecap="round" pathLength="100" strokeDasharray={`${Math.max(0, Math.min(100, r.value)) * 0.48} 100`} strokeDashoffset={-i * 25} className={['stroke-amber', 'stroke-teal', 'stroke-clay', 'stroke-sage'][i]} />)}
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-[44px] font-semibold leading-none">{loading ? '—' : lifeScore}</span>
            <span className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">Life score</span>
          </span>
        </Link>
        <div className="min-w-0 flex-1 space-y-3.5">
          {rings.map((r, i) => {
            const Icon = [Heart, CircleDollarSign, Target, Sun][i];
            return <Link key={r.label} to={r.to as never} className="flex items-center gap-2 text-[13px]" onClick={() => haptic('tap')}>
              <span className={`grid size-5 shrink-0 place-items-center rounded-full text-accent-foreground ${['bg-amber', 'bg-teal', 'bg-clay', 'bg-sage'][i]}`}><Icon className="size-3" /></span>
              <span className="text-muted-foreground">{r.label}</span><span className="ml-auto font-medium">{loading ? '—' : r.value}</span>
            </Link>;
          })}
        </div>
      </section>
      <div className="grid grid-cols-2 gap-3 pt-1">
        {[{to:'/tasks', label:'Tasks', value:`${doneTasks}/${totalTasks}`, pct:totalTasks ? doneTasks / totalTasks * 100 : 0, icon:Check, tone:'text-clay', bar:'bg-clay'}, {to:'/habits', label:'Habits', value:`${habitPct}%`, pct:habitPct, icon:Flame, tone:'text-amber', bar:'bg-amber'}].map(item => <Link key={item.label} to={item.to as never} className="card-soft press min-w-0 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-1"><span className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground"><item.icon className={`size-3.5 ${item.tone}`} />{item.label}</span><span className="font-serif text-[27px] font-semibold leading-tight">{item.value}</span></div>
          <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-surface"><div className={`h-full rounded-full ${item.bar}`} style={{width:`${Math.min(100, Math.max(0, item.pct))}%`}} /></div>
        </Link>)}
      </div>

      {dashboard.isError ? (
        <section className="card-soft rise p-6">
          <p className="label-quiet">Today is taking a breath</p>
          <h2 className="mt-3 font-serif text-2xl leading-snug">We couldn't load your dashboard.</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {dashboard.error instanceof Error ? dashboard.error.message : "Please try again in a moment."}
          </p>
          <button
            onClick={() => dashboard.refetch()}
            className="press mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
          >
            Try again
          </button>
        </section>
      ) : loading ? (
        <div className="space-y-4">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </div>
      ) : (
        <>
          {/* Today's focus — the single primary action on the screen */}
          <section className="card-lift rise relative overflow-hidden px-6 py-7">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-accent">Today's focus</p>
            {focus ? (
              <>
                <h2 className="mt-3 font-serif text-2xl leading-snug tracking-tight">{focus.title}</h2>
                {focus.tag && <p className="mt-1.5 text-sm text-muted-foreground">{focus.tag}</p>}
                <button
                  onClick={() => {
                    haptic("soft");
                    toggle.mutate({ id: focus.id, completed: true });
                  }}
                  className="press relative z-10 mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[12.5px] font-bold text-accent-foreground"
                >
                  <Check className="size-4" strokeWidth={2.4} /> I've done this
                </button>
              </>
            ) : (
              <>
                <h2 className="mt-3 font-serif text-2xl leading-snug tracking-tight">Nothing pressing</h2>
                <p className="mt-2 max-w-[95%] text-[14px] leading-[1.8] text-muted-foreground">
                  A rare kind of quiet. You're allowed to enjoy it, not fill it.
                </p>
                <Link
                  to="/tasks"
                  className="press relative z-10 mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[12.5px] font-bold text-accent-foreground"
                >
                  Add something small <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </Link>
              </>
            )}
          </section>

          <div className="grid grid-cols-4 gap-3 py-2">
            {[{to:'/capture',label:'Capture',icon:PencilLine},{to:'/tasks',label:'Add task',icon:Plus},{to:'/calendar',label:'Calendar',icon:CalendarDays},{to:'/finance',label:'Money',icon:CircleDollarSign}].map((a,i) => <Link key={a.to} to={a.to as never} onClick={() => haptic('tap')} className="press flex min-w-0 flex-col items-center gap-2 text-[11px] text-muted-foreground"><span className={`grid size-[54px] place-items-center rounded-[18px] border ${i === 0 ? 'border-accent/30 bg-accent-soft text-accent' : 'border-border bg-card'}`}><a.icon className="size-6" strokeWidth={1.7}/></span>{a.label}</Link>)}
          </div>
          <p className="label-quiet pt-2">Then</p>
          {/* Next action + upcoming event — one quiet timeline */}
          <section className="card-soft rise p-6">
            <ul className="space-y-4">
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
                <li className="flex items-center gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface"><Circle className="size-4" /></span>
                  The rest of the day is open, yours to shape.
                </li>
              )}
            </ul>
          </section>

      {showFirstRunSetup && (
        <section className="card-soft rise p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-quiet">First-time setup</p>
              <h2 className="mt-2 font-serif text-2xl leading-snug">Make Origin useful in three minutes.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Add just enough context for your Today view to feel personal. You can change everything later.
              </p>
            </div>
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground">
              {setupSteps.filter((step) => step.done).length}/{setupSteps.length}
            </span>
          </div>
          <div className="mt-5 space-y-2.5">
            {setupSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.label}
                  to={step.to as never}
                  onClick={() => haptic("tap")}
                  className="press flex items-center gap-3 rounded-2xl bg-surface px-4 py-3"
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                      step.done ? "bg-accent text-accent-foreground" : "bg-card text-accent"
                    }`}
                  >
                    {step.done ? <Check className="size-4" strokeWidth={2.4} /> : <Icon className="size-4" strokeWidth={1.9} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{step.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{step.detail}</span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground" strokeWidth={1.8} />
                </Link>
              );
            })}
          </div>
        </section>
      )}

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
              {recommendation?.body ?? aiInsight?.body ?? buildInsight(openCount, data?.profile?.energy_level ?? null)}
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

const TONES = {
  accent: { bg: "bg-accent-soft", fg: "text-accent" },
  sky: { bg: "bg-sky-soft", fg: "text-sky" },
  leaf: { bg: "bg-leaf-soft", fg: "text-leaf" },
  amber: { bg: "bg-amber-soft", fg: "text-amber" },
} as const;

function Tile({
  to,
  label,
  value,
  note,
  tone,
}: {
  to: string;
  label: string;
  value: string;
  note: string;
  tone: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <Link
      to={to as never}
      onClick={() => haptic("tap")}
      className="press tile rise flex flex-col gap-2.5 p-[18px]"
      style={{ borderRadius: "var(--radius-xl)" }}
    >
      <span className={`chip-icon ${t.bg}`} style={{ borderRadius: "0.75rem" }}>
        <span className={`size-2 rounded-full ${t.fg} bg-current`} />
      </span>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      <span className="font-serif text-[24px] font-semibold leading-none tracking-tight">{value}</span>
      <span className="text-[11px] leading-snug text-muted-foreground">{note}</span>
    </Link>
  );
}
