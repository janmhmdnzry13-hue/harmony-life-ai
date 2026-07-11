import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTasks, upsertTask, toggleTask, deleteTask } from "@/lib/tasks.functions";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

const PRIORITIES = ["low", "medium", "high"] as const;

function TasksPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTasks);
  const upsertFn = useServerFn(upsertTask);
  const toggleFn = useServerFn(toggleTask);
  const delFn = useServerFn(deleteTask);
  const q = useQuery({ queryKey: ["tasks"], queryFn: () => listFn() });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [tag, setTag] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [justToday, setJustToday] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          title,
          priority,
          tag: tag || null,
          due_date: dueDate || null,
          just_for_today: justToday,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setOpen(false);
      setTitle("");
      setTag("");
      setDueDate("");
      setPriority("medium");
      setJustToday(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const toggle = useMutation({
    mutationFn: (v: { id: string; completed: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const openTasks = (q.data ?? []).filter((t) => !t.completed);
  const done = (q.data ?? []).filter((t) => t.completed).slice(0, 20);

  return (
    <div className="px-5 pt-12 pb-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mb-2">Tasks.</h1>
          <p className="text-sm text-ink/60">
            {openTasks.length} open · {done.length} done
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="size-11 bg-ink text-paper border border-ink flex items-center justify-center"
        >
          <Plus className="size-5" />
        </button>
      </header>

      <div className="divide-y divide-ink/10 mb-8">
        {openTasks.map((t) => (
          <div key={t.id} className="py-3 flex items-center gap-3 group">
            <button
              onClick={() => toggle.mutate({ id: t.id, completed: true })}
              className="size-5 border border-ink/30 shrink-0"
              aria-label="Complete"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{t.title}</p>
              <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">
                {t.tag ? `${t.tag} · ` : ""}
                {t.priority}
                {t.due_date ? ` · ${format(parseISO(t.due_date), "MMM d")}` : ""}
                {t.expires_on ? " · today only" : ""}
              </p>
            </div>
            <button
              onClick={() => del.mutate(t.id)}
              className="p-1 text-ink/40 hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {openTasks.length === 0 && (
          <p className="py-8 text-center text-sm text-ink/40 font-serif italic">
            Nothing pending. Breathe.
          </p>
        )}
      </div>

      {done.length > 0 && (
        <section>
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-3">
            Completed
          </h3>
          <div className="divide-y divide-ink/5">
            {done.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center gap-3 opacity-50">
                <button
                  onClick={() => toggle.mutate({ id: t.id, completed: false })}
                  className="size-5 bg-ink border border-ink shrink-0"
                />
                <p className="text-sm line-through flex-1">{t.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-2xl mb-4">New task</h2>
            <input
              autoFocus
              placeholder="What needs doing?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3 focus:outline-none focus:border-ink/40"
            />
            <div className="flex gap-2 mb-3">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 text-xs uppercase tracking-widest border ${
                    priority === p ? "bg-ink text-paper border-ink" : "border-ink/15"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <input
                placeholder="Tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40"
              />
            </div>
            <button
              disabled={!title.trim() || create.isPending}
              onClick={() => create.mutate()}
              className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40"
            >
              Add task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
