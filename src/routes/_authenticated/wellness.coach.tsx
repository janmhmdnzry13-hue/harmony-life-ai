import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { runWellnessCoach } from "@/lib/wellness-coach.functions";

export const Route = createFileRoute("/_authenticated/wellness/coach")({
  component: WellnessCoachPage,
});

const SCOPES = [
  { key: "daily", label: "Daily advice", blurb: "One personalized note today." },
  { key: "motivation", label: "Motivation", blurb: "A grounded reflection." },
  { key: "habits", label: "Habits", blurb: "Adjustments based on consistency." },
  { key: "burnout", label: "Burnout", blurb: "Risk read and recovery step." },
] as const;

function WellnessCoachPage() {
  const fn = useServerFn(runWellnessCoach);
  const [scope, setScope] = useState<(typeof SCOPES)[number]["key"]>("daily");
  const analyze = useMutation({
    mutationFn: (s: (typeof SCOPES)[number]["key"]) => fn({ data: { scope: s } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="px-5 pt-8 pb-8">
      <header className="mb-6">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">AI wellness coach</span>
        <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Origin.</h1>
        <p className="text-sm text-ink/60 max-w-[35ch] mt-2">A calm reading of your sleep, mood, stress, and habits.</p>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-2">
        {SCOPES.map((s) => (
          <button key={s.key} onClick={() => setScope(s.key)} className={`text-left p-3 border ${scope === s.key ? "bg-ink text-paper border-ink" : "border-ink/15"}`}>
            <p className="text-xs font-medium uppercase tracking-widest">{s.label}</p>
            <p className={`text-[11px] mt-1 ${scope === s.key ? "opacity-70" : "text-ink/50"}`}>{s.blurb}</p>
          </button>
        ))}
      </section>

      <button onClick={() => analyze.mutate(scope)} disabled={analyze.isPending} className="w-full bg-ink text-paper py-3 text-sm font-medium mb-6 flex items-center justify-center gap-2 disabled:opacity-40">
        {analyze.isPending ? <><Loader2 className="size-4 animate-spin" /> Reading…</> : <><Sparkles className="size-4 text-accent" /> Analyze</>}
      </button>

      {analyze.data && (
        <section className="p-5 border border-ink/10 bg-surface">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-3.5 text-accent"/>
            <span className="text-[10px] font-medium uppercase tracking-widest text-ink/60">Origin · {scope}</span>
          </div>
          <p className="font-serif italic text-lg leading-snug mb-5">"{analyze.data.insight}"</p>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-ink/10 text-xs">
            <Metric label="Avg sleep" value={analyze.data.summary.avgSleepHours ? `${analyze.data.summary.avgSleepHours}h` : "—"}/>
            <Metric label="Avg mood" value={String(analyze.data.summary.avgMood ?? "—")}/>
            <Metric label="Avg stress" value={String(analyze.data.summary.avgStress ?? "—")}/>
            <Metric label="Workouts" value={String(analyze.data.summary.workouts)}/>
            <Metric label="Habit consistency" value={`${analyze.data.summary.habitConsistencyPct}%`}/>
            <Metric label="Burnout risk" value={analyze.data.summary.burnoutRisk}/>
          </div>
        </section>
      )}

      {!analyze.data && !analyze.isPending && (
        <p className="text-sm text-ink/40 text-center font-serif italic py-8">Pick a scope, then let Origin read the numbers.</p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">{label}</p>
      <p className="font-serif text-lg">{value}</p>
    </div>
  );
}
