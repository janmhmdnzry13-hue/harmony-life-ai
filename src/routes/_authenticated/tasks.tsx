import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTasks, upsertTask, toggleTask, deleteTask } from "@/lib/tasks.functions";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Check, ListChecks, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { haptic, praise } from "@/lib/feel";
import { useCelebrate } from "@/components/celebration";
import { CardSkeleton, EmptyState } from "@/components/soft";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Origin Life OS" },
      { name: "description", content: "A short, kind list of what needs doing today." },
      { property: "og:title", content: "Tasks — Origin Life OS" },
      { property: "og:description", content: "A short, kind list of what needs doing today." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

const PRIORITIES = [
  { key: "low", label: "Whenever" },
  { key: "medium", label: "Soon" },
  { key: "high", label: "Today" },
] as const;

function TasksPage() {
  const qc = useQueryClient();
  const celebrate = useCelebrate();
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
        data: { title, priority, tag: tag || null, due_date: dueDate || null, just_for_today: justToday },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      celebrate("Added. No rush on it.");
      setOpen(false);
      setTitle("");
      setTag("");
      setDueDate("");
      setPriority("medium");
      setJustToday(false);
    },
    onError: () => toast.error("That didn't save. Mind trying once more?"),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: string; completed: boolean }) => toggleFn({ data: v }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      if (v.completed) celebrate(praise.task());
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const openTasks = (q.data ?? []).filter((t) => !t.completed);
  const done = (q.data ?? []).filter((t) => t.completed).slice(0, 20);

  return (
    <div className="px-5 pt-8 pb-4 space-y-4">
      <header className="rise flex items-end justify-between px-1 pb-2">
        <div>
          <p className="label-quiet">Tasks</p>
          <h1 className="mt-2 font-serif text-[34px] leading-tight tracking-tight">Your list.</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {openTasks.length === 0
              ? "Clear for now."
              : `${openTasks.length} open${done.length ? ` · ${done.length} done` : ""}`}
          </p>
        </div>
        <button
          onClick={() => {
            haptic("tap");
            setOpen(true);
          }}
          aria-label="Add a task"
          className="press grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <Plus className="size-5" strokeWidth={2.2} />
        </button>
      </header>

      {q.isLoading ? (
        <div className="space-y-4">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </div>
      ) : openTasks.length === 0 ? (
        <div className="card-soft">
          <EmptyState
            icon={<ListChecks className="size-5" strokeWidth={1.8} />}
            title="Nothing waiting on you."
            body="When something comes to mind, put it here and let your head rest."
            action={
              <button
                onClick={() => setOpen(true)}
                className="press rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
              >
                Add a task
              </button>
            }
          />
        </div>
      ) : (
        <section className="card-soft rise divide-y divide-border overflow-hidden">
          {openTasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3.5 px-5 py-4">
              <button
                onClick={() => {
                  haptic("soft");
                  toggle.mutate({ id: t.id, completed: true });
                }}
                aria-label={`Complete ${t.title}`}
                className="press grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-transparent transition-colors active:text-accent"
              >
                <Check className="size-4" strokeWidth={2.4} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium leading-snug">{t.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {[
                    t.tag,
                    PRIORITIES.find((p) => p.key === t.priority)?.label,
                    t.due_date ? format(parseISO(t.due_date), "MMM d") : null,
                    t.expires_on ? "just for today" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                onClick={() => {
                  haptic("warn");
                  del.mutate(t.id);
                }}
                className="press p-1.5 text-muted-foreground"
                aria-label="Remove task"
              >
                <Trash2 className="size-4" strokeWidth={1.8} />
              </button>
            </div>
          ))}
        </section>
      )}

      {done.length > 0 && (
        <section className="card-soft rise p-5">
          <p className="label-quiet">Done recently</p>
          <div className="mt-3 space-y-2.5">
            {done.map((t) => (
              <button
                key={t.id}
                onClick={() => toggle.mutate({ id: t.id, completed: false })}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Check className="size-3.5" strokeWidth={2.6} />
                </span>
                <span className="truncate text-sm text-muted-foreground">{t.title}</span>
              </button>
            ))}
          </div>
        </section>
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
                <h2 className="font-serif text-2xl">Add a task</h2>
                <p className="mt-1 text-xs text-muted-foreground">Only the title matters. The rest is optional.</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="press p-1 text-muted-foreground">
                <X className="size-5" strokeWidth={1.8} />
              </button>
            </div>

            <input
              autoFocus
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-5 w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-[15px] outline-none focus:border-accent/50"
            />

            <div className="mt-3 flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    haptic("tap");
                    setPriority(p.key);
                  }}
                  className={`press flex-1 rounded-xl py-2.5 text-xs font-semibold ${
                    priority === p.key ? "bg-accent text-accent-foreground" : "bg-surface text-muted-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                placeholder="Label (optional)"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent/50"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent/50"
              />
            </div>

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
              disabled={!title.trim() || create.isPending}
              onClick={() => create.mutate()}
              className="press mt-5 w-full rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-foreground disabled:opacity-40"
            >
              {create.isPending ? "Saving…" : "Add it"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
