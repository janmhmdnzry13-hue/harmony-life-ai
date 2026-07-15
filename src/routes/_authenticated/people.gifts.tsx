import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listContacts, upsertGift, deleteGift } from "@/lib/people.functions";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/people/gifts")({
  component: GiftsPage,
});

function GiftsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listContacts);
  const saveFn = useServerFn(upsertGift);
  const delFn = useServerFn(deleteGift);
  const q = useQuery({ queryKey: ["people"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          contact_id: contactId || undefined,
          title,
          occasion: occasion || undefined,
          budget: budget ? Number(budget) : undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      setOpen(false);
      setTitle("");
      setOccasion("");
      setBudget("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });

  const gifts = q.data?.gifts ?? [];
  const contacts = q.data?.contacts ?? [];

  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl leading-[1.05] tracking-tight">Gifts.</h1>
          <p className="text-sm text-ink/60 mt-1">Ideas, budgets, follow-through.</p>
        </div>
        <button onClick={() => setOpen(true)} className="size-9 bg-ink text-paper flex items-center justify-center">
          <Plus className="size-4" />
        </button>
      </header>

      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {gifts.length === 0 && (
          <p className="py-8 text-sm text-ink/40 font-serif italic text-center">No gift ideas yet.</p>
        )}
        {gifts.map((g) => {
          const contact = contacts.find((c) => c.id === g.contact_id);
          return (
            <div key={g.id} className="py-3 flex items-start gap-3 group">
              <div className="flex-1">
                <p className="text-sm font-medium">{g.title}</p>
                <p className="text-xs text-ink/50">
                  {contact?.name ?? "—"}
                  {g.occasion ? ` · ${g.occasion}` : ""}
                  {g.budget != null ? ` · $${g.budget}` : ""}
                </p>
                <span className="text-[9px] uppercase tracking-widest text-ink/40 border border-ink/15 px-1 mt-1 inline-block">
                  {g.status}
                </span>
              </div>
              <button onClick={() => del.mutate(g.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/40">
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-4">New gift idea</h2>
            <input autoFocus placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <select value={contactId} onChange={(e) => setContactId(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3">
              <option value="">— Contact —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input placeholder="Occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <input type="number" placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <button disabled={!title.trim() || save.isPending} onClick={() => save.mutate()} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">
              Add idea
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
