import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listMood, addMood, deleteMood,
  listGratitude, saveGratitude,
  listReflections, addReflection, deleteReflection,
  listStress, addStress,
  analyzeEmotions,
} from "@/lib/mind.functions";

export const Route = createFileRoute("/_authenticated/wellness/mind")({
  component: MindPage,
});

const SUB = ["mood", "gratitude", "reflection", "stress", "emotion"] as const;

function MindPage() {
  const [tab, setTab] = useState<(typeof SUB)[number]>("mood");
  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-5">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">Mental</span>
        <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Mind.</h1>
      </header>
      <div className="grid grid-cols-5 gap-1 mb-5">
        {SUB.map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`py-2 border text-[10px] uppercase tracking-widest ${tab === s ? "bg-ink text-paper border-ink" : "border-ink/10 text-ink/60"}`}>
            {s}
          </button>
        ))}
      </div>
      {tab === "mood" && <MoodPanel />}
      {tab === "gratitude" && <GratitudePanel />}
      {tab === "reflection" && <ReflectionPanel />}
      {tab === "stress" && <StressPanel />}
      {tab === "emotion" && <EmotionPanel />}
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

function MoodPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["mood"], queryFn: useServerFn(listMood) });
  const addFn = useServerFn(addMood);
  const delFn = useServerFn(deleteMood);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState("");
  const add = useMutation({
    mutationFn: () => addFn({ data: { mood, energy, tags: [], notes: notes || null } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mood"] }); setNotes(""); toast.success("Logged"); },
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["mood"] }) });
  const emoji = ["😞", "😕", "😐", "🙂", "😄"];
  return (
    <div className="space-y-4">
      <div className="p-4 border border-ink/10 bg-surface">
        <p className="text-[10px] uppercase tracking-widest text-ink/50 mb-2">Mood</p>
        <div className="flex justify-between mb-3">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setMood(n)}
              className={`size-11 text-2xl border ${mood === n ? "border-ink bg-ink/5" : "border-ink/10"}`}>{emoji[n-1]}</button>
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-widest text-ink/50 mb-2">Energy</p>
        <div className="flex gap-1 mb-3">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setEnergy(n)}
              className={`flex-1 py-2 border text-xs ${energy >= n ? "bg-accent border-accent text-ink" : "border-ink/10 text-ink/40"}`}>{n}</button>
          ))}
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything on your mind?"
          className="w-full bg-paper border border-ink/10 px-3 py-2 text-sm mb-2 min-h-[70px]"/>
        <button onClick={() => add.mutate()} className="w-full bg-ink text-paper py-2 text-xs uppercase tracking-widest">Log mood</button>
      </div>
      <div className="space-y-2">
        {(q.data ?? []).map((r) => (
          <div key={r.id} className="flex justify-between items-center p-3 border border-ink/10">
            <div className="min-w-0">
              <p className="text-2xl">{emoji[r.mood - 1]} <span className="text-ink/50 text-xs align-middle">energy {r.energy ?? "—"}</span></p>
              {r.notes && <p className="text-sm text-ink/70 mt-1">{r.notes}</p>}
              <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-1">{new Date(r.logged_at).toLocaleString()}</p>
            </div>
            <button onClick={() => del.mutate(r.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
          </div>
        ))}
        {(q.data ?? []).length === 0 && <EmptyText>No mood logged yet.</EmptyText>}
      </div>
    </div>
  );
}

function GratitudePanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["gratitude"], queryFn: useServerFn(listGratitude) });
  const saveFn = useServerFn(saveGratitude);
  const [entries, setEntries] = useState<[string, string, string]>(["", "", ""]);
  const save = useMutation({
    mutationFn: () => saveFn({ data: { log_date: today(), entries: entries.filter(Boolean) } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gratitude"] }); setEntries(["","",""]); toast.success("Saved"); },
  });
  return (
    <div className="space-y-4">
      <div className="p-4 border border-ink/10 bg-surface space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-ink/50">Three things today</p>
        {entries.map((v, i) => (
          <input key={i} value={v}
            onChange={(e) => setEntries(prev => { const c = [...prev] as [string,string,string]; c[i] = e.target.value; return c; })}
            placeholder={`I'm grateful for…`} className="w-full bg-paper border border-ink/10 px-3 py-2 text-sm"/>
        ))}
        <button disabled={!entries.some(Boolean)} onClick={() => save.mutate()} className="w-full bg-ink text-paper py-2 text-xs uppercase tracking-widest disabled:opacity-40">Save today</button>
      </div>
      <div className="space-y-2">
        {(q.data ?? []).map((r) => (
          <div key={r.id} className="p-3 border border-ink/10">
            <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">{r.log_date}</p>
            <ul className="space-y-1 text-sm">
              {r.entries.map((e: string, i: number) => <li key={i} className="font-serif italic">— {e}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReflectionPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["reflections"], queryFn: useServerFn(listReflections) });
  const addFn = useServerFn(addReflection);
  const delFn = useServerFn(deleteReflection);
  const [body, setBody] = useState("");
  const [prompt, setPrompt] = useState("");
  const add = useMutation({
    mutationFn: () => addFn({ data: { log_date: today(), prompt: prompt || null, body } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reflections"] }); setBody(""); setPrompt(""); },
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["reflections"] }) });
  return (
    <div className="space-y-4">
      <div className="p-4 border border-ink/10 bg-surface space-y-2">
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt (optional)" className="w-full bg-paper border border-ink/10 px-3 py-2 text-sm"/>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write freely…" className="w-full bg-paper border border-ink/10 px-3 py-2 text-sm min-h-[140px]"/>
        <button disabled={!body.trim()} onClick={() => add.mutate()} className="w-full bg-ink text-paper py-2 text-xs uppercase tracking-widest disabled:opacity-40">Save reflection</button>
      </div>
      <div className="space-y-2">
        {(q.data ?? []).map((r) => (
          <div key={r.id} className="p-3 border border-ink/10">
            <div className="flex justify-between mb-1">
              <p className="text-[10px] uppercase tracking-widest text-ink/40">{r.log_date}{r.prompt ? ` · ${r.prompt}` : ""}</p>
              <button onClick={() => del.mutate(r.id)} className="p-1 text-ink/40"><Trash2 className="size-3.5"/></button>
            </div>
            <p className="font-serif text-sm whitespace-pre-wrap">{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StressPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["stress"], queryFn: useServerFn(listStress) });
  const addFn = useServerFn(addStress);
  const [level, setLevel] = useState(5);
  const [triggers, setTriggers] = useState("");
  const [notes, setNotes] = useState("");
  const add = useMutation({
    mutationFn: () => addFn({ data: { level, triggers: triggers.split(",").map(s => s.trim()).filter(Boolean), notes: notes || null } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stress"] }); setTriggers(""); setNotes(""); },
  });
  return (
    <div className="space-y-4">
      <div className="p-4 border border-ink/10 bg-surface">
        <p className="text-[10px] uppercase tracking-widest text-ink/50 mb-2">Stress level · {level}/10</p>
        <input type="range" min={1} max={10} value={level} onChange={(e) => setLevel(Number(e.target.value))} className="w-full accent-ink mb-3"/>
        <input value={triggers} onChange={(e) => setTriggers(e.target.value)} placeholder="Triggers (comma separated)" className="w-full bg-paper border border-ink/10 px-3 py-2 text-sm mb-2"/>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full bg-paper border border-ink/10 px-3 py-2 text-sm min-h-[70px] mb-2"/>
        <button onClick={() => add.mutate()} className="w-full bg-ink text-paper py-2 text-xs uppercase tracking-widest">Log stress</button>
      </div>
      <div className="space-y-2">
        {(q.data ?? []).map((r) => (
          <div key={r.id} className="p-3 border border-ink/10">
            <p className="font-serif text-lg">{r.level}/10</p>
            {r.triggers?.length ? <p className="text-[10px] uppercase tracking-widest text-ink/50">{r.triggers.join(", ")}</p> : null}
            {r.notes && <p className="text-sm text-ink/70 mt-1">{r.notes}</p>}
            <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-1">{new Date(r.logged_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmotionPanel() {
  const fn = useServerFn(analyzeEmotions);
  const analyze = useMutation({ mutationFn: () => fn(), onError: (e) => toast.error(e.message) });
  return (
    <div className="space-y-4">
      <button onClick={() => analyze.mutate()} disabled={analyze.isPending} className="w-full bg-ink text-paper py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40">
        {analyze.isPending ? <><Loader2 className="size-4 animate-spin"/> Reading…</> : <><Sparkles className="size-4 text-accent"/> Analyze last 14 days</>}
      </button>
      {analyze.data && (
        <div className="p-5 border border-ink/10 bg-surface">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-3.5 text-accent"/>
            <span className="text-[10px] uppercase tracking-widest text-ink/60">Origin · emotion</span>
          </div>
          <p className="font-serif italic text-lg leading-snug mb-4">"{analyze.data.insight}"</p>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink/10 text-xs">
            <Small label="Avg mood" value={analyze.data.avgMood ?? "—"}/>
            <Small label="Avg stress" value={analyze.data.avgStress ?? "—"}/>
          </div>
        </div>
      )}
    </div>
  );
}

function Small({ label, value }: { label: string; value: string | number }) {
  return <div><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">{label}</p><p className="font-serif text-lg">{value}</p></div>;
}
function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-center py-6 text-sm text-ink/40 font-serif italic">{children}</p>;
}
