import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2, Sun, Moon, Flame } from "lucide-react";
import { toast } from "sonner";
import { listRoutines, createRoutine, deleteRoutine, toggleRoutineStep } from "@/lib/routines.functions";

export const Route = createFileRoute("/_authenticated/wellness/routines")({
  component: RoutinesPage,
});

function RoutinesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["routines"], queryFn: useServerFn(listRoutines) });
  const createFn = useServerFn(createRoutine);
  const delFn = useServerFn(deleteRoutine);
  const toggleFn = useServerFn(toggleRoutineStep);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"morning" | "night">("morning");
  const [stepsText, setStepsText] = useState("");

  const create = useMutation({
    mutationFn: () => createFn({ data: { name, kind, steps: stepsText.split("\n").map((s) => s.trim()).filter(Boolean) } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["routines"] }); setOpen(false); setName(""); setStepsText(""); },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }) });
  const toggle = useMutation({
    mutationFn: (v: { routine_id: string; step_index: number }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });

  const routines = q.data?.routines ?? [];
  const logs = q.data?.logs ?? [];

  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-5 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">Rituals</span>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Routines.</h1>
        </div>
        <button onClick={() => setOpen(true)} className="size-11 bg-ink text-paper flex items-center justify-center"><Plus className="size-5"/></button>
      </header>

      <div className="mb-5 p-3 border border-ink/10 bg-surface flex items-center gap-3">
        <Flame className="size-4 text-accent"/>
        <div className="flex-1">
          <p className="text-sm">Habits & streaks</p>
          <p className="text-[10px] uppercase tracking-widest text-ink/50">Daily habit tracker</p>
        </div>
        <Link to="/habits" className="text-[11px] uppercase tracking-widest px-3 py-1.5 border border-ink/20">Open →</Link>
      </div>

      <div className="space-y-4">
        {routines.map((r) => {
          const log = logs.find((l) => l.routine_id === r.id);
          const done = new Set<number>(log?.completed_steps ?? []);
          const Icon = r.kind === "morning" ? Sun : Moon;
          return (
            <div key={r.id} className="p-4 border border-ink/10 bg-surface">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-accent"/>
                  <h3 className="font-serif text-lg">{r.name}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-ink/40">{r.kind}</span>
                </div>
                <button onClick={() => del.mutate(r.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
              </div>
              <ul className="space-y-2">
                {r.steps.map((s: string, i: number) => (
                  <li key={i}>
                    <button onClick={() => toggle.mutate({ routine_id: r.id, step_index: i })}
                      className={`w-full text-left flex items-center gap-3 p-2 border ${done.has(i) ? "bg-ink text-paper border-ink" : "border-ink/10"}`}>
                      <span className={`size-4 border ${done.has(i) ? "bg-accent border-accent" : "border-ink/30"}`}/>
                      <span className={`text-sm ${done.has(i) ? "line-through opacity-70" : ""}`}>{s}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-3">{done.size}/{r.steps.length} today</p>
            </div>
          );
        })}
        {routines.length === 0 && <p className="text-center py-8 font-serif italic text-ink/40 text-sm">Design a morning or night ritual.</p>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-4">New routine</h2>
            <input autoFocus placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3"/>
            <div className="flex gap-2 mb-3">
              {(["morning","night"] as const).map(k => (
                <button key={k} onClick={() => setKind(k)} className={`flex-1 py-2 border text-xs uppercase tracking-widest ${kind === k ? "bg-ink text-paper border-ink" : "border-ink/10"}`}>{k}</button>
              ))}
            </div>
            <textarea placeholder="One step per line" value={stepsText} onChange={(e) => setStepsText(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-4 min-h-[120px]"/>
            <button disabled={!name.trim() || !stepsText.trim()} onClick={() => create.mutate()} className="w-full bg-ink text-paper py-3 text-sm disabled:opacity-40">Create routine</button>
          </div>
        </div>
      )}
    </div>
  );
}
