import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getBoard, upsertCard, moveCard, deleteCard, upsertColumn } from "@/lib/projects.functions";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  component: BoardPage,
});

function BoardPage() {
  const { id } = useParams({ from: "/_authenticated/projects/$id" });
  const qc = useQueryClient();
  const boardFn = useServerFn(getBoard);
  const cardFn = useServerFn(upsertCard);
  const moveFn = useServerFn(moveCard);
  const delFn = useServerFn(deleteCard);
  const colFn = useServerFn(upsertColumn);
  const q = useQuery({ queryKey: ["board", id], queryFn: () => boardFn({ data: { project_id: id } }) });

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [cardTitle, setCardTitle] = useState("");
  const [newCol, setNewCol] = useState("");

  const addCard = useMutation({
    mutationFn: (column_id: string) =>
      cardFn({ data: { project_id: id, column_id, title: cardTitle, position: 0 } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", id] });
      setAddingTo(null);
      setCardTitle("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const move = useMutation({
    mutationFn: (v: { id: string; column_id: string }) =>
      moveFn({ data: { ...v, position: 0 } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", id] }),
  });
  const del = useMutation({
    mutationFn: (cid: string) => delFn({ data: { id: cid } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", id] }),
  });
  const addCol = useMutation({
    mutationFn: () =>
      colFn({
        data: { project_id: id, name: newCol, position: (q.data?.columns.length ?? 0) },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", id] });
      setNewCol("");
    },
  });

  const cols = q.data?.columns ?? [];
  const cards = q.data?.cards ?? [];

  return (
    <div className="pt-12 pb-8">
      <header className="mb-6 px-5">
        <h1 className="font-serif text-3xl leading-[1.05] tracking-tight">
          {q.data?.project?.name ?? "Board"}
        </h1>
        {q.data?.project?.description && (
          <p className="text-sm text-ink/60 mt-1">{q.data.project.description}</p>
        )}
      </header>

      <div className="flex gap-3 overflow-x-auto px-5 pb-4">
        {cols.map((col) => {
          const colCards = cards.filter((c) => c.column_id === col.id);
          return (
            <div key={col.id} className="min-w-[260px] w-[260px] border border-ink/10 bg-surface flex flex-col">
              <div className="px-3 py-2 border-b border-ink/10 flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest font-medium">{col.name}</span>
                <span className="text-[10px] text-ink/40">{colCards.length}</span>
              </div>
              <div className="p-2 space-y-2 flex-1 min-h-[80px]">
                {colCards.map((c) => (
                  <div key={c.id} className="bg-paper border border-ink/10 p-2.5 group">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium flex-1">{c.title}</p>
                      <button
                        onClick={() => del.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-ink/40"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                    {c.description && <p className="text-xs text-ink/60 mt-1">{c.description}</p>}
                    <div className="flex gap-1 mt-2">
                      {cols
                        .filter((cc) => cc.id !== col.id)
                        .map((cc) => (
                          <button
                            key={cc.id}
                            onClick={() => move.mutate({ id: c.id, column_id: cc.id })}
                            className="text-[9px] uppercase tracking-widest border border-ink/15 px-1.5 py-0.5 text-ink/50 hover:border-ink hover:text-ink"
                          >
                            → {cc.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {addingTo === col.id ? (
                  <div>
                    <input
                      autoFocus
                      placeholder="Card title"
                      value={cardTitle}
                      onChange={(e) => setCardTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && cardTitle.trim() && addCard.mutate(col.id)}
                      className="w-full bg-paper border border-ink/20 px-2 py-1.5 text-xs"
                    />
                    <button
                      onClick={() => cardTitle.trim() && addCard.mutate(col.id)}
                      className="w-full mt-1 bg-ink text-paper py-1 text-[10px] uppercase tracking-widest"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo(col.id)}
                    className="w-full py-2 text-xs text-ink/40 hover:text-ink border border-dashed border-ink/15"
                  >
                    + Add card
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className="min-w-[220px] w-[220px] flex flex-col justify-start">
          <input
            placeholder="+ New column"
            value={newCol}
            onChange={(e) => setNewCol(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newCol.trim() && addCol.mutate()}
            className="w-full bg-surface border border-dashed border-ink/20 px-3 py-3 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
