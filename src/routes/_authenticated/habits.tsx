import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listHabits, createHabit, toggleHabitLog, deleteHabit } from "@/lib/habits.functions";
import { useState } from "react";
import { format, subDays } from "date-fns";
import { Check, Plus, Repeat, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { haptic, praise, habitEncouragement } from "@/lib/feel";
import { useCelebrate } from "@/components/celebration";
import { CardSkeleton, EmptyState } from "@/components/soft";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({
    meta: [
      { title: "Habits — Origin Life OS" },
      { name: "description", content: "Gentle daily rituals. Consistency over perfection." },
      { property: "og:title", content: "Habits — Origin Life OS" },
      { property: "og:description", content: "Gentle daily rituals. Consistency over perfection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HabitsPage,
});

function HabitsPage() {
  const qc = useQueryClient();
  const celebrate = useCelebrate();
  const listFn = useServerFn(listHabits);
  const createFn = useServerFn(createHabit);
  const toggleFn = useServerFn(toggleHabitLog);
  const delFn = useServerFn(deleteHabit);
  const q = useQuery({ queryKey: ["habits"], queryFn: () => listFn() });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [justToday, setJustToday] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      createFn({ data: { name, description: description || null, target_per_day: 1, just_for_today: justToday } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      celebrate("Begun. Tomorrow is all it takes.");
      setOpen(false);
      setName("");
      setDescription("");
      setJustToday(false);
    },
    onError: () => toast.error("That didn't save. Mind trying once more?"),
  });

  const toggle = useMutation({
    mutationFn: (v: { habit_id: string; log_date: string; streak: number; wasDone: boolean }) =>
      toggleFn({ data: { habit_id: v.habit_id, log_date: v.log_date } }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      if (!v.wasDone) celebrate(praise.habit(v.streak + 1));
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });

  const habits = q.data?.habits ?? [];
  const logs = q.data?.logs ?? [];
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const days = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), "yyyy-MM-dd"));
  const doneCount = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.log_date === todayStr)).length;

  return (
    <div className="px-5 pt-8 pb-4 space-y-4">
      <header className="rise flex items-end justify-between px-1 pb-2">
        <div className="min-w-0">
          <p className="label-quiet">Habits</p>
          <h1 className="mt-2 font-serif text-[34px] leading-tight tracking-tight">Your rituals.</h1>
          <p className="mt-1.5 max-w-[30ch] text-sm text-muted-foreground">
            {habitEncouragement(doneCount, habits.length)}
          </p>
        </div>
        <button
          onClick={() => {
            haptic("tap");
            setOpen(true);
          }}
          aria-label="Add a habit"
          className="press grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <Plus className="size-5" strokeWidth={2.2} />
        </button>
      </header>

      {q.isLoading ? (
        <div className="space-y-4">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
      ) : habits.length === 0 ? (
        <div className="card-soft">
          <EmptyState
            icon={<Repeat className="size-5" strokeWidth={1.8} />}
            title="Choose one ritual to begin."
            body="A good first habit takes less than ten minutes and gives you an easy win every day."
            tips={["Drink water after waking", "Walk outside for five minutes", "Write one sentence before bed"]}
            action={
              <button
                onClick={() => setOpen(true)}
                className="press rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
              >
                Add a habit
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((h) => {
            const habitLogs = logs.filter((l) => l.habit_id === h.id);
            const streak = computeStreak(habitLogs.map((l) => l.log_date));
            const doneToday = habitLogs.some((l) => l.log_date === todayStr);

            return (
              <section key={h.id} className="card-soft rise p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-lg leading-snug">{h.name}</h2>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[
                        h.description,
                        streak > 0 ? `${streak} day${streak === 1 ? "" : "s"} in a row` : "ready when you are",
                        h.expires_on ? "just for today" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      haptic("warn");
                      del.mutate(h.id);
                    }}
                    className="press p-1.5 text-muted-foreground"
                    aria-label="Remove habit"
                  >
                    <Trash2 className="size-4" strokeWidth={1.8} />
                  </button>
                </div>

                <div className="mt-4 flex items-end gap-1.5">
                  {days.map((d, i) => {
                    const done = habitLogs.some((l) => l.log_date === d);
                    return (
                      <span
                        key={d}
                        title={format(new Date(d), "MMM d")}
                        className={`flex-1 rounded-md transition-all duration-500 ${
                          done ? "bg-accent" : "bg-surface"
                        }`}
                        style={{ height: done ? 26 : 14, transitionDelay: `${i * 18}ms` }}
                      />
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    haptic("soft");
                    toggle.mutate({ habit_id: h.id, log_date: todayStr, streak, wasDone: doneToday });
                  }}
                  className={`press mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold ${
                    doneToday ? "bg-surface text-muted-foreground" : "bg-accent text-accent-foreground"
                  }`}
                >
                  {doneToday ? (
                    <>
                      <Check className="size-4" strokeWidth={2.4} /> Done today
                    </>
                  ) : (
                    "Mark today"
                  )}
                </button>
              </section>
            );
          })}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="rise w-full max-w-[520px] rounded-t-3xl bg-card p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-2xl">New habit</h2>
                <p className="mt-1 text-xs text-muted-foreground">Keep it small. Small is what lasts.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="press p-1 text-muted-foreground">
                <X className="size-5" strokeWidth={1.8} />
              </button>
            </div>

            <input
              autoFocus
              placeholder="Morning walk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-5 w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-[15px] outline-none focus:border-accent/50"
            />
            <input
              placeholder="Ten minutes is enough (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent/50"
            />

            <label className="mt-4 flex cursor-pointer select-none items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={justToday}
                onChange={(e) => setJustToday(e.target.checked)}
                className="size-4 accent-[var(--accent)]"
              />
              <span>
                Just for today
                <span className="text-muted-foreground"> — it clears itself tomorrow</span>
              </span>
            </label>

            <button
              disabled={!name.trim() || create.isPending}
              onClick={() => create.mutate()}
              className="press mt-5 w-full rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-foreground disabled:opacity-40"
            >
              {create.isPending ? "Saving…" : "Begin"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function computeStreak(dates: string[]) {
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  while (set.has(format(d, "yyyy-MM-dd"))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
