import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listHabits, createHabit, toggleHabitLog, deleteHabit } from "@/lib/habits.functions";
import { useState } from "react";
import { format, subDays } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/habits")({
  component: HabitsPage,
});

function HabitsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listHabits);
  const createFn = useServerFn(createHabit);
  const toggleFn = useServerFn(toggleHabitLog);
  const delFn = useServerFn(deleteHabit);
  const q = useQuery({ queryKey: ["habits"], queryFn: () => listFn() });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createFn({ data: { name, description: description || null, target_per_day: 1 } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits"] });
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const toggle = useMutation({
    mutationFn: (v: { habit_id: string; log_date: string }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["habits"] }),
  });

  const habits = q.data?.habits ?? [];
  const logs = q.data?.logs ?? [];
  const days = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), "yyyy-MM-dd"));

  return (
    <div className="px-5 pt-12 pb-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mb-2">Habits.</h1>
          <p className="text-sm text-ink/60 max-w-[35ch]">
            Small consistent actions lead to significant long-term growth.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="size-11 bg-ink text-paper border border-ink flex items-center justify-center"
        >
          <Plus className="size-5" />
        </button>
      </header>

      <div className="space-y-4">
        {habits.map((h) => {
          const habitLogs = logs.filter((l) => l.habit_id === h.id);
          const streak = computeStreak(habitLogs.map((l) => l.log_date));
          const todayStr = format(new Date(), "yyyy-MM-dd");
          const doneToday = habitLogs.some((l) => l.log_date === todayStr);

          return (
            <div key={h.id} className="p-4 border border-ink/10 bg-surface group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-lg">{h.name}</h4>
                  {h.description && (
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">
                      {h.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-serif italic text-xl text-accent">{streak}d</div>
                  <button
                    onClick={() => del.mutate(h.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-ink/40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {days.map((d) => {
                  const done = habitLogs.some((l) => l.log_date === d);
                  return (
                    <div
                      key={d}
                      className={`flex-1 h-8 border ${done ? "bg-accent border-accent" : "border-ink/10 bg-paper"}`}
                    />
                  );
                })}
              </div>

              <button
                onClick={() => toggle.mutate({ habit_id: h.id, log_date: todayStr })}
                className={`w-full py-2.5 text-xs uppercase tracking-widest font-medium border ${
                  doneToday ? "bg-ink text-paper border-ink" : "border-ink/20"
                }`}
              >
                {doneToday ? "Completed today" : "Mark today"}
              </button>
            </div>
          );
        })}
        {habits.length === 0 && (
          <p className="text-center py-12 font-serif italic text-ink/40 text-sm">
            Start with one habit. Repeat tomorrow.
          </p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-2xl mb-4">New habit</h2>
            <input
              autoFocus
              placeholder="Name (e.g. Morning meditation)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3 focus:outline-none focus:border-ink/40"
            />
            <input
              placeholder="Optional detail (e.g. 15 minutes)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-4 focus:outline-none focus:border-ink/40"
            />
            <button
              disabled={!name.trim() || create.isPending}
              onClick={() => create.mutate()}
              className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40"
            >
              Add habit
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
