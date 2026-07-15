import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listContacts,
  upsertReminder,
  deleteReminder,
  markContacted,
} from "@/lib/people.functions";
import { useState } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/people/reminders")({
  component: RemindersPage,
});

function RemindersPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listContacts);
  const saveFn = useServerFn(upsertReminder);
  const delFn = useServerFn(deleteReminder);
  const markFn = useServerFn(markContacted);
  const q = useQuery({ queryKey: ["people"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [cadence, setCadence] = useState("30");

  const save = useMutation({
    mutationFn: () => saveFn({ data: { contact_id: contactId, cadence_days: Number(cadence) } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      setOpen(false);
      setContactId("");
      setCadence("30");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const mark = useMutation({
    mutationFn: (id: string) => markFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });

  const today = new Date();
  const list = (q.data?.reminders ?? [])
    .map((r) => {
      const contact = q.data?.contacts.find((c) => c.id === r.contact_id);
      const daysUntil = r.next_due_on ? differenceInDays(parseISO(r.next_due_on), today) : 0;
      return { ...r, contact, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl leading-[1.05] tracking-tight">Reach out.</h1>
          <p className="text-sm text-ink/60 mt-1">Stay in touch on your own cadence.</p>
        </div>
        <button onClick={() => setOpen(true)} className="size-9 bg-ink text-paper flex items-center justify-center">
          <Plus className="size-4" />
        </button>
      </header>

      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {list.length === 0 && (
          <p className="py-8 text-sm text-ink/40 font-serif italic text-center">No reminders set.</p>
        )}
        {list.map((r) => (
          <div key={r.id} className="py-3 flex items-center gap-3 group">
            <div className="flex-1">
              <p className="text-sm font-medium">{r.contact?.name ?? "—"}</p>
              <p className="text-xs text-ink/50">
                Every {r.cadence_days}d ·{" "}
                {r.next_due_on
                  ? r.daysUntil <= 0
                    ? "Due now"
                    : `Due in ${r.daysUntil}d (${format(parseISO(r.next_due_on), "MMM d")})`
                  : "—"}
              </p>
            </div>
            <button onClick={() => mark.mutate(r.id)} className="p-1.5 border border-ink/15 text-ink/60 hover:border-ink hover:text-ink" title="Mark contacted">
              <Check className="size-4" />
            </button>
            <button onClick={() => del.mutate(r.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/40">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-4">New reminder</h2>
            <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3">
              <option value="">— Contact —</option>
              {(q.data?.contacts ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input type="number" placeholder="Cadence (days)" value={cadence} onChange={(e) => setCadence(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <button disabled={!contactId || save.isPending} onClick={() => save.mutate()} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">
              Add reminder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
