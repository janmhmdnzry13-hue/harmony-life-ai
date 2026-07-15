import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getTrip,
  upsertItem,
  deleteItem,
  addPacking,
  togglePacking,
  deletePacking,
  addJournal,
  deleteJournal,
} from "@/lib/travel.functions";
import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/travel/$id")({
  component: TripDetail,
});

function TripDetail() {
  const { id } = useParams({ from: "/_authenticated/travel/$id" });
  const qc = useQueryClient();
  const tripFn = useServerFn(getTrip);
  const itemFn = useServerFn(upsertItem);
  const delItemFn = useServerFn(deleteItem);
  const packFn = useServerFn(addPacking);
  const togglePackFn = useServerFn(togglePacking);
  const delPackFn = useServerFn(deletePacking);
  const journalFn = useServerFn(addJournal);
  const delJournalFn = useServerFn(deleteJournal);

  const q = useQuery({ queryKey: ["trip", id], queryFn: () => tripFn({ data: { id } }) });
  const [itemTitle, setItemTitle] = useState("");
  const [itemKind, setItemKind] = useState<"flight" | "hotel" | "activity" | "transport">("activity");
  const [itemCost, setItemCost] = useState("");
  const [packLabel, setPackLabel] = useState("");
  const [journalTitle, setJournalTitle] = useState("");
  const [journalBody, setJournalBody] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["trip", id] });

  const addItem = useMutation({
    mutationFn: () =>
      itemFn({
        data: { trip_id: id, title: itemTitle, kind: itemKind, cost: itemCost ? Number(itemCost) : undefined },
      }),
    onSuccess: () => {
      invalidate();
      setItemTitle("");
      setItemCost("");
    },
  });
  const delI = useMutation({ mutationFn: (iid: string) => delItemFn({ data: { id: iid } }), onSuccess: invalidate });
  const addPack = useMutation({
    mutationFn: () => packFn({ data: { trip_id: id, label: packLabel } }),
    onSuccess: () => {
      invalidate();
      setPackLabel("");
    },
  });
  const togglePack = useMutation({
    mutationFn: (v: { id: string; packed: boolean }) => togglePackFn({ data: v }),
    onSuccess: invalidate,
  });
  const delPack = useMutation({ mutationFn: (pid: string) => delPackFn({ data: { id: pid } }), onSuccess: invalidate });
  const addJ = useMutation({
    mutationFn: () =>
      journalFn({
        data: {
          trip_id: id,
          entry_date: new Date().toISOString().slice(0, 10),
          title: journalTitle,
          body: journalBody,
        },
      }),
    onSuccess: () => {
      invalidate();
      setJournalTitle("");
      setJournalBody("");
    },
  });
  const delJ = useMutation({ mutationFn: (jid: string) => delJournalFn({ data: { id: jid } }), onSuccess: invalidate });

  const spent = (q.data?.items ?? []).reduce((s, i) => s + Number(i.cost ?? 0), 0);
  const budget = Number(q.data?.trip?.budget ?? 0);

  return (
    <div className="px-5 pt-12 pb-8 space-y-8">
      <header>
        <h1 className="font-serif text-3xl leading-[1.05] tracking-tight">{q.data?.trip?.title}</h1>
        <p className="text-sm text-ink/60 mt-1">
          {q.data?.trip?.destination}
          {q.data?.trip?.starts_on && ` · ${format(parseISO(q.data.trip.starts_on), "MMM d")}`}
        </p>
        {budget > 0 && (
          <p className="text-xs text-ink/50 mt-1">
            Spent ${spent.toFixed(0)} of ${budget.toFixed(0)}
          </p>
        )}
      </header>

      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium mb-2">Itinerary</h3>
        <div className="divide-y divide-ink/10 border-y border-ink/10 mb-3">
          {(q.data?.items ?? []).map((i) => (
            <div key={i.id} className="py-2 flex items-start gap-3 group">
              <span className="text-[9px] uppercase tracking-widest text-ink/40 w-14 pt-1">{i.kind}</span>
              <div className="flex-1">
                <p className="text-sm">{i.title}</p>
                {i.starts_at && (
                  <p className="text-[10px] uppercase tracking-widest text-ink/40">
                    {format(parseISO(i.starts_at), "MMM d, h:mm a")}
                  </p>
                )}
              </div>
              {i.cost != null && <span className="text-xs text-ink/60">${Number(i.cost).toFixed(0)}</span>}
              <button onClick={() => delI.mutate(i.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/40">
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input placeholder="Add item" value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} className="flex-1 bg-surface border border-ink/10 px-2 py-2 text-xs" />
          <select value={itemKind} onChange={(e) => setItemKind(e.target.value as never)} className="bg-surface border border-ink/10 px-2 py-2 text-xs">
            <option value="activity">Activity</option>
            <option value="flight">Flight</option>
            <option value="hotel">Hotel</option>
            <option value="transport">Transport</option>
          </select>
          <input type="number" placeholder="$" value={itemCost} onChange={(e) => setItemCost(e.target.value)} className="w-16 bg-surface border border-ink/10 px-2 py-2 text-xs" />
          <button onClick={() => itemTitle && addItem.mutate()} className="bg-ink text-paper px-3 py-2 text-xs">Add</button>
        </div>
      </section>

      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium mb-2">Packing</h3>
        <div className="divide-y divide-ink/10 border-y border-ink/10 mb-3">
          {(q.data?.packing ?? []).map((p) => (
            <div key={p.id} className="py-2 flex items-center gap-3 group">
              <button
                onClick={() => togglePack.mutate({ id: p.id, packed: !p.packed })}
                className={`size-5 border ${p.packed ? "bg-ink text-paper border-ink" : "border-ink/20"} flex items-center justify-center`}
              >
                {p.packed && <Check className="size-3" />}
              </button>
              <span className={`text-sm flex-1 ${p.packed ? "line-through text-ink/40" : ""}`}>{p.label}</span>
              <button onClick={() => delPack.mutate(p.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/40">
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input placeholder="Add item to pack" value={packLabel} onChange={(e) => setPackLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && packLabel && addPack.mutate()} className="flex-1 bg-surface border border-ink/10 px-2 py-2 text-xs" />
          <button onClick={() => packLabel && addPack.mutate()} className="bg-ink text-paper px-3 py-2 text-xs">Add</button>
        </div>
      </section>

      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium mb-2">Journal</h3>
        <div className="space-y-2 mb-3">
          {(q.data?.journal ?? []).map((j) => (
            <div key={j.id} className="border border-ink/10 p-3 group relative">
              <p className="text-[10px] uppercase tracking-widest text-ink/40">
                {format(parseISO(j.entry_date), "EEEE, MMM d")}
              </p>
              {j.title && <p className="font-serif text-lg mt-1">{j.title}</p>}
              {j.body && <p className="text-sm text-ink/70 mt-1 whitespace-pre-wrap">{j.body}</p>}
              <button onClick={() => delJ.mutate(j.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-ink/40">
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
        <input placeholder="Entry title" value={journalTitle} onChange={(e) => setJournalTitle(e.target.value)} className="w-full bg-surface border border-ink/10 px-2 py-2 text-xs mb-2" />
        <textarea placeholder="Write…" value={journalBody} onChange={(e) => setJournalBody(e.target.value)} rows={3} className="w-full bg-surface border border-ink/10 px-2 py-2 text-xs mb-2" />
        <button onClick={() => (journalTitle || journalBody) && addJ.mutate()} className="w-full bg-ink text-paper py-2 text-xs">
          <Plus className="size-3 inline mr-1" /> Add entry
        </button>
      </section>
    </div>
  );
}
