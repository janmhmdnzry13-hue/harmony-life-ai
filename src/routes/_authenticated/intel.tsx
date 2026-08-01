import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Brain,
  Trash2,
  Plus,
  ShieldAlert,
  TrendingUp,
  RefreshCw,
  Bot,
  CalendarClock,
} from "lucide-react";
import {
  refreshScores,
  getScoreHistory,
  listInsights,
  dismissInsight,
  runIntelligence,
  generatePlan,
  generateReport,
  listMemories,
  addMemory,
  deleteMemory,
  listAutomations,
  upsertAutomation,
  runAgent,
} from "@/lib/intelligence.functions";
import { ScoreRing, Sparkline } from "@/components/score-ring";

export const Route = createFileRoute("/_authenticated/intel")({
  head: () => ({
    meta: [
      { title: "Life Score & Intelligence — Origin" },
      {
        name: "description",
        content:
          "Your Life Score across health, finance, productivity and happiness, with predictive insights, AI agents and long-term memory.",
      },
      { property: "og:title", content: "Life Score & Intelligence — Origin" },
      {
        property: "og:description",
        content: "Predictive life analytics, proactive AI agents and durable memory in one calm dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntelPage,
});

const AGENTS = [
  { key: "planner", name: "Planner", desc: "Reshapes your day around energy and events." },
  { key: "health", name: "Health", desc: "Watches sleep, movement, hydration." },
  { key: "finance", name: "Finance", desc: "Watches cash flow and budgets." },
  { key: "productivity", name: "Productivity", desc: "Watches follow-through and focus." },
  { key: "burnout", name: "Burnout", desc: "Predicts overload before it lands." },
  { key: "goals", name: "Goals", desc: "Predicts which goals will slip." },
] as const;

type AgentKey = (typeof AGENTS)[number]["key"];

function IntelPage() {
  const qc = useQueryClient();
  const refreshFn = useServerFn(refreshScores);
  const historyFn = useServerFn(getScoreHistory);
  const insightsFn = useServerFn(listInsights);
  const dismissFn = useServerFn(dismissInsight);
  const intelFn = useServerFn(runIntelligence);
  const planFn = useServerFn(generatePlan);
  const reportFn = useServerFn(generateReport);
  const memListFn = useServerFn(listMemories);
  const memAddFn = useServerFn(addMemory);
  const memDelFn = useServerFn(deleteMemory);
  const autoListFn = useServerFn(listAutomations);
  const autoUpsertFn = useServerFn(upsertAutomation);
  const agentFn = useServerFn(runAgent);

  const scores = useQuery({ queryKey: ["life-scores-now"], queryFn: () => refreshFn() });
  const history = useQuery({ queryKey: ["life-scores-history"], queryFn: () => historyFn() });
  const insights = useQuery({ queryKey: ["ai-insights"], queryFn: () => insightsFn() });
  const memories = useQuery({ queryKey: ["ai-memories"], queryFn: () => memListFn() });
  const automations = useQuery({ queryKey: ["ai-automations"], queryFn: () => autoListFn() });

  const [plan, setPlan] = useState<string>("");
  const [memInput, setMemInput] = useState("");

  const invalidate = (keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Something went wrong");

  const analyze = useMutation({
    mutationFn: () => intelFn(),
    onSuccess: () => {
      invalidate(["ai-insights", "life-scores-now"]);
      toast.success("Origin refreshed your intelligence feed");
    },
    onError: fail,
  });
  const recompute = useMutation({
    mutationFn: () => refreshFn(),
    onSuccess: () => invalidate(["life-scores-now", "life-scores-history"]),
    onError: fail,
  });
  const dismiss = useMutation({
    mutationFn: (id: string) => dismissFn({ data: { id } }),
    onSuccess: () => invalidate(["ai-insights"]),
    onError: fail,
  });
  const makePlan = useMutation({
    mutationFn: (day: "today" | "tomorrow") => planFn({ data: { day } }),
    onSuccess: (r) => setPlan(r.plan),
    onError: fail,
  });
  const report = useMutation({
    mutationFn: (kind: "weekly" | "monthly") => reportFn({ data: { kind } }),
    onSuccess: (r) => toast.success(`${r.kind === "weekly" ? "Weekly" : "Monthly"} report saved to Assistant`),
    onError: fail,
  });
  const addMem = useMutation({
    mutationFn: (content: string) => memAddFn({ data: { content, kind: "fact", importance: 4 } }),
    onSuccess: () => {
      setMemInput("");
      invalidate(["ai-memories"]);
    },
    onError: fail,
  });
  const delMem = useMutation({
    mutationFn: (id: string) => memDelFn({ data: { id } }),
    onSuccess: () => invalidate(["ai-memories"]),
    onError: fail,
  });
  const toggleAgent = useMutation({
    mutationFn: (v: { agent: (typeof AGENTS)[number]; active: boolean }) =>
      autoUpsertFn({
        data: {
          agent_key: v.agent.key,
          name: v.agent.name,
          description: v.agent.desc,
          schedule: "daily",
          active: v.active,
        },
      }),
    onSuccess: () => invalidate(["ai-automations"]),
    onError: fail,
  });
  const fireAgent = useMutation({
    mutationFn: (key: AgentKey) => agentFn({ data: { agent_key: key } }),
    onSuccess: () => {
      invalidate(["ai-insights", "ai-automations"]);
      toast.success("Agent reported back");
    },
    onError: fail,
  });

  const s = scores.data;
  const hist = history.data ?? [];
  const burnout = s?.burnout ?? 0;

  return (
    <div className="px-5 pt-10 pb-8">
      <header className="mb-7">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">Intelligence</span>
        <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Life Score.</h1>
        <p className="text-sm text-ink/60 max-w-[34ch] mt-2">
          One number for how your life is actually going — and an assistant that acts on it.
        </p>
      </header>

      {/* Life score */}
      <section className="glass p-5 mb-4">
        {scores.isPending ? (
          <div className="h-40 flex items-center justify-center text-ink/40">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink/50 font-medium mb-1">Overall</p>
                <p className="font-serif text-6xl leading-none">{s?.life ?? 0}</p>
              </div>
              <button
                onClick={() => recompute.mutate()}
                disabled={recompute.isPending}
                className="size-9 border border-ink/15 flex items-center justify-center disabled:opacity-40"
                aria-label="Recompute score"
              >
                <RefreshCw className={`size-4 ${recompute.isPending ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <ScoreRing label="Health" value={s?.health ?? 0} />
              <ScoreRing label="Finance" value={s?.finance ?? 0} />
              <ScoreRing label="Focus" value={s?.productivity ?? 0} />
              <ScoreRing label="Joy" value={s?.happiness ?? 0} accent />
            </div>
            <div className="mt-6 pt-4 border-t border-ink/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-ink/50 font-medium">Burnout risk</span>
                <span className={`text-xs font-medium ${burnout >= 60 ? "text-destructive" : "text-ink/60"}`}>
                  {burnout >= 60 ? "High" : burnout >= 30 ? "Moderate" : "Low"} · {burnout}
                </span>
              </div>
              <div className="h-1.5 bg-ink/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${burnout >= 60 ? "bg-destructive" : "bg-ink"}`}
                  style={{ width: `${burnout}%` }}
                />
              </div>
            </div>
          </>
        )}
      </section>

      {/* Trend */}
      <section className="border border-ink/10 p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="size-3.5 text-accent" />
          <span className="text-[10px] uppercase tracking-widest text-ink/50 font-medium">Life score trend</span>
        </div>
        <Sparkline points={hist.map((h) => h.life_score)} />
        <p className="text-[11px] text-ink/40 mt-2">{hist.length} day{hist.length === 1 ? "" : "s"} recorded</p>
      </section>

      {/* Insights */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium">Proactive intelligence</h3>
          <button
            onClick={() => analyze.mutate()}
            disabled={analyze.isPending}
            className="text-[11px] px-3 py-1.5 bg-ink text-paper flex items-center gap-1.5 disabled:opacity-40"
          >
            {analyze.isPending ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-accent" />}
            {analyze.isPending ? "Reading…" : "Analyze"}
          </button>
        </div>
        <div className="space-y-2">
          {(insights.data ?? []).length === 0 && !analyze.isPending && (
            <p className="py-8 text-sm text-ink/40 font-serif italic text-center">
              Nothing flagged. Run an analysis to look ahead.
            </p>
          )}
          {(insights.data ?? []).map((i) => (
            <article
              key={i.id}
              className={`glass p-4 ${i.severity === "critical" ? "border-destructive/40" : ""}`}
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  {i.severity === "critical" ? (
                    <ShieldAlert className="size-3.5 text-destructive" />
                  ) : i.kind === "prediction" ? (
                    <TrendingUp className="size-3.5 text-accent" />
                  ) : (
                    <Sparkles className="size-3.5 text-accent" />
                  )}
                  <span className="text-[10px] uppercase tracking-widest text-ink/50 font-medium">
                    {i.kind} · {i.domain} · {i.confidence}%
                  </span>
                </div>
                <button onClick={() => dismiss.mutate(i.id)} className="text-ink/30 hover:text-ink text-xs">
                  ✕
                </button>
              </div>
              <h4 className="font-serif text-lg leading-snug">{i.title}</h4>
              <p className="text-sm text-ink/70 mt-1">{i.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Planner */}
      <section className="border border-ink/10 p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="size-3.5 text-accent" />
          <span className="text-[10px] uppercase tracking-widest text-ink/50 font-medium">AI day planner</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => makePlan.mutate("today")}
            disabled={makePlan.isPending}
            className="border border-ink/15 py-2.5 text-xs disabled:opacity-40"
          >
            Plan today
          </button>
          <button
            onClick={() => makePlan.mutate("tomorrow")}
            disabled={makePlan.isPending}
            className="border border-ink/15 py-2.5 text-xs disabled:opacity-40"
          >
            Plan tomorrow
          </button>
        </div>
        {makePlan.isPending && <p className="text-xs text-ink/40 mt-3 italic font-serif">Shaping the day…</p>}
        {plan && <pre className="mt-4 text-sm font-serif whitespace-pre-wrap leading-relaxed">{plan}</pre>}
      </section>

      {/* Agents */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="size-3.5 text-accent" />
          <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium">Automation agents</h3>
        </div>
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {AGENTS.map((a) => {
            const row = (automations.data ?? []).find((r) => r.agent_key === a.key);
            const active = row?.active ?? false;
            return (
              <div key={a.key} className="py-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-serif text-base">{a.name}</p>
                  <p className="text-[11px] text-ink/50">{a.desc}</p>
                  {row?.last_result && (
                    <p className="text-[11px] text-ink/60 mt-1.5 font-serif italic line-clamp-2">{row.last_result}</p>
                  )}
                </div>
                <button
                  onClick={() => fireAgent.mutate(a.key)}
                  disabled={fireAgent.isPending}
                  className="text-[10px] uppercase tracking-widest border border-ink/15 px-2 py-1.5 disabled:opacity-40"
                >
                  Run
                </button>
                <button
                  onClick={() => toggleAgent.mutate({ agent: a, active: !active })}
                  aria-label={`${active ? "Disable" : "Enable"} ${a.name} agent`}
                  className={`w-11 h-6 border transition-colors relative ${active ? "bg-ink border-ink" : "border-ink/20"}`}
                >
                  <span
                    className={`absolute top-0.5 size-4 transition-all ${active ? "left-6 bg-paper" : "left-0.5 bg-ink/30"}`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Memory */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="size-3.5 text-accent" />
          <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium">Long-term memory</h3>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (memInput.trim()) addMem.mutate(memInput.trim());
          }}
          className="flex gap-2 mb-3"
        >
          <input
            value={memInput}
            onChange={(e) => setMemInput(e.target.value)}
            placeholder="Teach Origin something durable…"
            className="flex-1 bg-surface border border-ink/10 px-3 py-2.5 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={addMem.isPending || !memInput.trim()}
            className="size-10 bg-ink text-paper flex items-center justify-center disabled:opacity-40"
            aria-label="Add memory"
          >
            <Plus className="size-4" />
          </button>
        </form>
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {(memories.data ?? []).length === 0 && (
            <p className="py-6 text-sm text-ink/40 font-serif italic text-center">
              Origin remembers what you tell it in chat.
            </p>
          )}
          {(memories.data ?? []).map((m) => (
            <div key={m.id} className="py-3 flex items-start gap-3">
              <span className="text-[10px] uppercase tracking-widest text-ink/40 pt-1 w-16 shrink-0">{m.kind}</span>
              <p className="flex-1 text-sm">{m.content}</p>
              <button onClick={() => delMem.mutate(m.id)} className="text-ink/30 hover:text-destructive" aria-label="Forget">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Reports */}
      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium mb-3">Life reports</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => report.mutate("weekly")}
            disabled={report.isPending}
            className="border border-ink/15 py-3 text-xs disabled:opacity-40"
          >
            Weekly report
          </button>
          <button
            onClick={() => report.mutate("monthly")}
            disabled={report.isPending}
            className="border border-ink/15 py-3 text-xs disabled:opacity-40"
          >
            Monthly report
          </button>
        </div>
        <Link to="/assistant" className="block text-[11px] text-ink/50 mt-3 underline">
          Read saved reports in Assistant →
        </Link>
      </section>
    </div>
  );
}
