import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/profile.functions";
import { listTasks, toggleTask } from "@/lib/tasks.functions";
import { listHabits, toggleHabitLog } from "@/lib/habits.functions";
import { listEvents } from "@/lib/events.functions";
import { listFinance } from "@/lib/finance.functions";
import { listSleep } from "@/lib/health.functions";
import { listInsights } from "@/lib/intelligence.functions";
import { format, parseISO } from "date-fns";
import { ArrowRight, Check, Clock, Heart, Sparkles, Wallet } from "lucide-react";
import { greeting, dayline, habitEncouragement, haptic, praise } from "@/lib/feel";
import { useCelebrate } from "@/components/celebration";
import { CardSkeleton } from "@/components/soft";


export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Today — Origin Life OS" },
      { name: "description", content: "A calm daily view of your focus, habits, health and money." },
      { property: "og:title", content: "Today — Origin Life OS" },
      { property: "og:description", content: "A calm daily view of your focus, habits, health and money." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profileFn = useServerFn(getProfile);
  const tasksFn = useServerFn(listTasks);
  const habitsFn = useServerFn(listHabits);
  const eventsFn = useServerFn(listEvents);
  const financeFn = useServerFn(listFinance);
  const sleepFn = useServerFn(listSleep);
  const insightsFn = useServerFn(listInsights);
  const toggleFn = useServerFn(toggleTask);
  const logHabitFn = useServerFn(toggleHabitLog);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => tasksFn() });
  const habitsQ = useQuery({ queryKey: ["habits"], queryFn: () => habitsFn() });
  const events = useQuery({ queryKey: ["events"], queryFn: () => eventsFn() });
  const finance = useQuery({ queryKey: ["finance"], queryFn: () => financeFn() });
  const sleep = useQuery({ queryKey: ["sleep"], queryFn: () => sleepFn() });
  const insights = useQuery({ queryKey: ["insights"], queryFn: () => insightsFn() });

  const toggle = useMutation({
    mutationFn: (v: { id: string; completed: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const logHabit = useMutation({
    mutationFn: (v: { habit_id: string; log_date: string }) => logHabitFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const open = (tasks.data ?? []).filter((t) => !t.completed);
  const focus = open.find((t) => t.priority === "high") ?? open[0];
  const upcoming = open.filter((t) => t.id !== focus?.id).slice(0, 2);
  const nextEvent = (events.data ?? []).find((e) => new Date(e.starts_at) >= new Date());

  const habits = habitsQ.data?.habits ?? [];
  const logs = habitsQ.data?.logs ?? [];
  const doneToday = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.log_date === today));
  const habitPct = habits.length ? Math.round((doneToday.length / habits.length) * 100) : 0;

  const monthTx = finance.data?.transactions ?? [];
  const monthKey = today.slice(0, 7);
  const spent = monthTx
    .filter((t) => t.type === "expense" && t.occurred_on.slice(0, 7) === monthKey)
    .reduce((s, t) => s + Number(t.amount), 0);
  const earned = monthTx
    .filter((t) => t.type === "income" && t.occurred_on.slice(0, 7) === monthKey)
    .reduce((s, t) => s + Number(t.amount), 0);

  const lastSleep = (sleep.data ?? [])[0];
  const sleepHrs = lastSleep?.duration_min ? (lastSleep.duration_min / 60).toFixed(1) : null;

  const topInsight = (insights.data ?? [])[0];
  const name = (profile.data?.display_name ?? "friend").split(" ")[0];

  return (
    <div className="px-5 pt-8 pb-4 space-y-4">
      {/* Greeting */}
      <header className="px-1 pb-2 rise">
        <p className="label-quiet">{format(new Date(), "EEEE, MMMM d")}</p>
        <h1 className="mt-2 font-serif text-[34px] leading-[1.15] tracking-tight">
          {getGreeting()}, {name}.
        </h1>
      </header>

      {/* Today's focus — the one primary action */}
      <section className="card-soft p-6 rise">
        <p className="label-quiet">Today's focus</p>
        {focus ? (
          <>
            <h2 className="mt-3 font-serif text-2xl leading-snug">{focus.title}</h2>
            {focus.tag && <p className="mt-1.5 text-sm text-muted-foreground">{focus.tag}</p>}
            <button
              onClick={() => toggle.mutate({ id: focus.id, completed: true })}
              className="press mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
            >
              <Check className="size-4" strokeWidth={2.4} /> Mark complete
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-3 font-serif text-2xl leading-snug">Nothing pressing.</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">A rare kind of clarity — use it well.</p>
            <Link
              to="/tasks"
              className="press mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
            >
              Add something <ArrowRight className="size-4" />
            </Link>
          </>
        )}
      </section>

      {/* Up next — tasks + calendar in one calm timeline */}
      <section className="card-soft p-6 rise">
        <div className="flex items-center justify-between">
          <p className="label-quiet">Up next</p>
          <Link to="/plan" className="text-xs font-semibold text-accent">
            Plan
          </Link>
        </div>
        <ul className="mt-4 space-y-4">
          {nextEvent && (
            <li className="flex items-start gap-3.5">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-surface">
                <Clock className="size-4 text-muted-foreground" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium">{nextEvent.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format(parseISO(nextEvent.starts_at), "h:mm a")}
                  {nextEvent.location ? ` · ${nextEvent.location}` : ""}
                </p>
              </div>
            </li>
          )}
          {upcoming.map((t) => (
            <li key={t.id} className="flex items-start gap-3.5">
              <button
                onClick={() => toggle.mutate({ id: t.id, completed: true })}
                aria-label={`Complete ${t.title}`}
                className="press mt-0.5 size-9 shrink-0 rounded-xl border border-border bg-card"
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium">{t.title}</p>
                {t.tag && <p className="mt-0.5 text-xs text-muted-foreground">{t.tag}</p>}
              </div>
            </li>
          ))}
          {!nextEvent && upcoming.length === 0 && (
            <li className="text-sm text-muted-foreground">Your day is open.</li>
          )}
        </ul>
      </section>

      {/* Habits */}
      <section className="card-soft p-6 rise">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="label-quiet">Habits</p>
            <p className="mt-2 font-serif text-2xl">
              {doneToday.length}
              <span className="text-muted-foreground text-lg"> / {habits.length || 0}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {habits.length === 0 ? "Add a habit to start a streak." : "completed today"}
            </p>
          </div>
          <Ring value={habitPct} />
        </div>
        {habits.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {habits.slice(0, 5).map((h) => {
              const done = doneToday.some((d) => d.id === h.id);
              return (
                <button
                  key={h.id}
                  onClick={() => logHabit.mutate({ habit_id: h.id, log_date: today })}
                  className={`press rounded-full px-3.5 py-1.5 text-xs font-medium ${
                    done
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface text-muted-foreground"
                  }`}
                >
                  {h.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Health + Money summaries */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/wellness" className="press card-soft p-5 rise">
          <Heart className="size-4 text-accent" strokeWidth={1.9} />
          <p className="label-quiet mt-3">Health</p>
          <p className="mt-1.5 font-serif text-2xl">{sleepHrs ? `${sleepHrs}h` : "—"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">last night's sleep</p>
        </Link>
        <Link to="/finance" className="press card-soft p-5 rise">
          <Wallet className="size-4 text-accent" strokeWidth={1.9} />
          <p className="label-quiet mt-3">Money</p>
          <p className="mt-1.5 font-serif text-2xl">
            {earned - spent >= 0 ? "+" : "−"}
            {Math.abs(Math.round(earned - spent)).toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">net this month</p>
        </Link>
      </div>

      {/* AI recommendation */}
      <section className="card-soft p-6 rise">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-accent" strokeWidth={2} />
          <p className="label-quiet">Origin suggests</p>
        </div>
        <p className="mt-3 font-serif text-lg italic leading-snug">
          {topInsight?.body ?? buildInsight(open.length, profile.data?.energy_level ?? null)}
        </p>
        <button
          onClick={() => navigate({ to: "/ai" as never })}
          className="press mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent"
        >
          Talk to Origin <ArrowRight className="size-4" />
        </button>
      </section>
    </div>
  );
}

function Ring({ value }: { value: number }) {
  const size = 68;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
      <span className="absolute inset-0 grid place-items-center font-serif text-sm">{value}%</span>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function buildInsight(open: number, energy: number | null) {
  if (energy !== null && energy <= 1)
    return "Your energy is low today. Choose one meaningful task and let the rest wait.";
  if (open === 0) return "Nothing is pending. Rest is also progress.";
  return `You have ${open} open ${open === 1 ? "task" : "tasks"}. Start with the smallest one.`;
}
