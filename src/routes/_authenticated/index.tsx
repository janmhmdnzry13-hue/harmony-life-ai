import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile, updateMood } from "@/lib/profile.functions";
import { listTasks, toggleTask } from "@/lib/tasks.functions";
import { listHabits, toggleHabitLog } from "@/lib/habits.functions";
import { listEvents } from "@/lib/events.functions";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, parseISO } from "date-fns";
import { ArrowRight, Sparkles, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

const MOODS = [
  { key: "calm", label: "Calm" },
  { key: "focused", label: "Focused" },
  { key: "tired", label: "Tired" },
  { key: "restless", label: "Restless" },
];

function HomePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profileFn = useServerFn(getProfile);
  const tasksFn = useServerFn(listTasks);
  const habitsFn = useServerFn(listHabits);
  const eventsFn = useServerFn(listEvents);
  const moodFn = useServerFn(updateMood);
  const toggleFn = useServerFn(toggleTask);
  const logHabitFn = useServerFn(toggleHabitLog);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => tasksFn() });
  const habitsQ = useQuery({ queryKey: ["habits"], queryFn: () => habitsFn() });
  const events = useQuery({ queryKey: ["events"], queryFn: () => eventsFn() });

  const setMood = useMutation({
    mutationFn: (v: { mood?: string; energy_level?: number }) => moodFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
  const toggle = useMutation({
    mutationFn: (v: { id: string; completed: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const logHabit = useMutation({
    mutationFn: (v: { habit_id: string; log_date: string }) => logHabitFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const topTasks = (tasks.data ?? []).filter((t) => !t.completed).slice(0, 3);
  const nextEvent = (events.data ?? []).find((e) => new Date(e.starts_at) >= new Date());
  const name = profile.data?.display_name ?? "friend";
  const greeting = getGreeting();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" as never });
  }

  return (
    <div className="px-5 pt-12 pb-8">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">
              {format(new Date(), "EEEE · MMM d")}
            </span>
          </div>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mb-4">
            {greeting}, {name.split(" ")[0]}.
          </h1>
        </div>
        <button onClick={signOut} className="p-2 text-ink/40 hover:text-ink" aria-label="Sign out">
          <LogOut className="size-4" />
        </button>
      </header>

      {/* Mood + energy */}
      <section className="mb-6">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/40 mb-3">
          How is today?
        </p>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map((m) => {
            const active = profile.data?.mood === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMood.mutate({ mood: m.key })}
                className={`px-3 py-1.5 text-sm border ${
                  active ? "bg-ink text-paper border-ink" : "border-ink/15 text-ink/70"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/40 mb-2">Energy</p>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((n) => {
              const active = (profile.data?.energy_level ?? -1) >= n;
              return (
                <button
                  key={n}
                  onClick={() => setMood.mutate({ energy_level: n })}
                  className={`flex-1 h-1.5 ${active ? "bg-ink" : "bg-ink/10"}`}
                  aria-label={`Energy ${n + 1}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Up next */}
      {nextEvent && (
        <section className="mb-6 p-4 border border-ink/10 bg-surface">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-medium uppercase tracking-widest text-ink/40">
              Up next
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 bg-accent/15 text-accent uppercase tracking-widest">
              {relativeTime(nextEvent.starts_at)}
            </span>
          </div>
          <h2 className="font-serif text-xl mb-1">{nextEvent.title}</h2>
          <p className="text-xs text-ink/60">
            {format(parseISO(nextEvent.starts_at), "h:mm a")}
            {nextEvent.location ? ` · ${nextEvent.location}` : ""}
          </p>
        </section>
      )}

      {/* AI card */}
      <section className="mb-6 p-5 bg-ink text-paper">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-3.5 text-accent" />
          <span className="text-[10px] font-medium uppercase tracking-widest opacity-60">
            Origin insight
          </span>
        </div>
        <p className="font-serif italic text-lg leading-snug mb-4">
          "{buildInsight(tasks.data ?? [], profile.data?.energy_level ?? null)}"
        </p>
        <button
          onClick={() => navigate({ to: "/ai" as never })}
          className="inline-flex items-center gap-2 text-xs bg-paper text-ink px-3 py-1.5 font-medium"
        >
          Talk to Origin <ArrowRight className="size-3.5" />
        </button>
      </section>

      {/* Priorities */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40">
            Top priorities
          </h3>
          <button
            onClick={() => navigate({ to: "/tasks" as never })}
            className="text-[10px] uppercase tracking-widest text-ink/60"
          >
            All →
          </button>
        </div>
        <div className="divide-y divide-ink/10">
          {topTasks.length === 0 && (
            <p className="text-sm text-ink/40 py-3">No open tasks. A quiet day.</p>
          )}
          {topTasks.map((t) => (
            <button
              key={t.id}
              onClick={() => toggle.mutate({ id: t.id, completed: !t.completed })}
              className="w-full py-3 flex items-center gap-3 text-left"
            >
              <span
                className={`size-5 border ${t.completed ? "bg-ink border-ink" : "border-ink/30"}`}
              />
              <div className="flex-1">
                <p className="text-sm">{t.title}</p>
                {t.tag && (
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">
                    {t.tag} · {t.priority}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Habits */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40">
            Habits today
          </h3>
          <button
            onClick={() => navigate({ to: "/habits" as never })}
            className="text-[10px] uppercase tracking-widest text-ink/60"
          >
            All →
          </button>
        </div>
        <div className="space-y-2">
          {(habitsQ.data?.habits ?? []).slice(0, 4).map((h) => {
            const done = (habitsQ.data?.logs ?? []).some(
              (l) => l.habit_id === h.id && l.log_date === today,
            );
            return (
              <button
                key={h.id}
                onClick={() => logHabit.mutate({ habit_id: h.id, log_date: today })}
                className="w-full flex items-center gap-3 p-3 border border-ink/10 text-left"
              >
                <span className={`size-5 border ${done ? "bg-accent border-accent" : "border-ink/30"}`} />
                <span className="text-sm flex-1">{h.name}</span>
                <span className="text-[10px] uppercase tracking-widest text-ink/40">
                  {done ? "Done" : "Tap"}
                </span>
              </button>
            );
          })}
          {(habitsQ.data?.habits ?? []).length === 0 && (
            <p className="text-sm text-ink/40">Add a habit to start a streak.</p>
          )}
        </div>
      </section>

      <p className="text-center font-serif italic text-sm text-ink/40 max-w-[30ch] mx-auto">
        "Small consistent actions, over time, become a life."
      </p>
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

function relativeTime(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 60000;
  if (diff < 0) return "now";
  if (diff < 60) return `in ${Math.round(diff)}m`;
  const h = diff / 60;
  if (h < 24) return `in ${Math.round(h)}h`;
  return `in ${Math.round(h / 24)}d`;
}

function buildInsight(tasks: { completed: boolean; priority: string }[], energy: number | null) {
  const open = tasks.filter((t) => !t.completed).length;
  const highs = tasks.filter((t) => !t.completed && t.priority === "high").length;
  if (highs > 0) return `You have ${highs} high-priority ${highs === 1 ? "task" : "tasks"} open. Start there while attention is fresh.`;
  if (energy !== null && energy <= 1)
    return "Your energy is low today. Consider one meaningful task and rest the rest.";
  if (open === 0) return "Your list is clear. A rare kind of clarity — use it well.";
  return `You have ${open} open ${open === 1 ? "task" : "tasks"} today. Let's move.`;
}
