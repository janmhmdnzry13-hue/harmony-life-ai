import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listTimeBlocks,
  upsertTimeBlock,
  deleteTimeBlock,
} from "@/lib/calendar-blocks.functions";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/calendar/blocks")({
  component: BlocksPage,
});

function BlocksPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTimeBlocks);
  const saveFn = useServerFn(upsertTimeBlock);
  const delFn = useServerFn(deleteTimeBlock);
  const q = useQuery({ queryKey: ["time_blocks"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  const save = useMutation({
    mutationFn: () =>
      saveFn({ data: { date, start_time: start, end_time: end, title, category: category || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time_blocks"] });
      setOpen(false);
      setTitle("");
      setCategory("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_blocks"] }),
  });

  const grouped: Record<string, typeof q.data> = {};
  for (const b of q.data ?? []) {
    (grouped[b.date] ||= []).push(b);
  }

  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl leading-[1.05] tracking-tight">Time blocks.</h1>
          <p className="text-sm text-ink/60 mt-1">Structure the day into intentional windows.</p>
        </div>
        <button onClick={() => setOpen(true)} className="size-9 bg-ink text-paper flex items-center justify-center">
          <Plus className="size-4" />
        </button>
      </header>

      {Object.keys(grouped).length === 0 && (
        <p className="py-8 text-sm text-ink/40 font-serif italic text-center">No blocks yet.</p>
      )}
      {Object.entries(grouped).map(([d, blocks]) => (
        <section key={d} className="mb-6">
          <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium mb-2">
            {format(new Date(d + "T00:00:00"), "EEEE, MMM d")}
          </h3>
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            {(blocks ?? []).map((b) => (
              <div key={b.id} className="py-3 flex items-start gap-3 group">
                <div className="text-[10px] uppercase tracking-widest text-ink/40 w-20 pt-1">
                  {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{b.title}</p>
                  {b.category && (
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">{b.category}</p>
                  )}
                </div>
                <button
                  onClick={() => del.mutate(b.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-ink/40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-4">New block</h2>
            <input
              autoFocus
              placeholder="Title (e.g. Deep work)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3 focus:outline-none focus:border-ink/40"
            />
            <div className="grid grid-cols-3 gap-2 mb-3">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-surface border border-ink/10 px-3 py-3 text-sm" />
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="bg-surface border border-ink/10 px-3 py-3 text-sm" />
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="bg-surface border border-ink/10 px-3 py-3 text-sm" />
            </div>
            <input
              placeholder="Category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3 focus:outline-none focus:border-ink/40"
            />
            <button
              disabled={!title.trim() || save.isPending}
              onClick={() => save.mutate()}
              className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40"
            >
              Add block
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
