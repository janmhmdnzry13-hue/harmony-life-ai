import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTrips, upsertTrip, deleteTrip } from "@/lib/travel.functions";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/travel")({
  component: TravelPage,
});

function TravelPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTrips);
  const saveFn = useServerFn(upsertTrip);
  const delFn = useServerFn(deleteTrip);
  const q = useQuery({ queryKey: ["trips"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [budget, setBudget] = useState("");

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          title,
          destination: destination || undefined,
          starts_on: starts || undefined,
          ends_on: ends || undefined,
          budget: budget ? Number(budget) : undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      setOpen(false);
      setTitle("");
      setDestination("");
      setStarts("");
      setEnds("");
      setBudget("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips"] }),
  });

  return (
    <div className="px-5 pt-12 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight">Travel.</h1>
          <p className="text-sm text-ink/60 mt-1">Trips, packing, budget, journal.</p>
        </div>
        <button onClick={() => setOpen(true)} className="size-9 bg-ink text-paper flex items-center justify-center">
          <Plus className="size-4" />
        </button>
      </header>

      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {(q.data ?? []).length === 0 && (
          <p className="py-8 text-sm text-ink/40 font-serif italic text-center">No trips yet.</p>
        )}
        {(q.data ?? []).map((t) => (
          <div key={t.id} className="py-4 flex items-start gap-3 group">
            <Link to="/travel/$id" params={{ id: t.id }} className="flex-1">
              <p className="font-serif text-lg">{t.title}</p>
              <p className="text-xs text-ink/50">
                {t.destination}
                {t.starts_on && ` · ${format(parseISO(t.starts_on), "MMM d")}`}
                {t.ends_on && ` – ${format(parseISO(t.ends_on), "MMM d")}`}
              </p>
            </Link>
            <button onClick={() => del.mutate(t.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/40">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-4">New trip</h2>
            <input autoFocus placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <input placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input type="date" value={starts} onChange={(e) => setStarts(e.target.value)} className="bg-surface border border-ink/10 px-3 py-3 text-sm" />
              <input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} className="bg-surface border border-ink/10 px-3 py-3 text-sm" />
            </div>
            <input type="number" placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <button disabled={!title.trim() || save.isPending} onClick={() => save.mutate()} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">
              Create trip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
