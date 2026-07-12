import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { runCoach } from "@/lib/coach.functions";

export const Route = createFileRoute("/_authenticated/finance/coach")({
  component: CoachPage,
});

const SCOPES = [
  { key: "full", label: "Full review", blurb: "Cash flow, portfolio, and one next step." },
  { key: "spending", label: "Spending", blurb: "Where money went this month." },
  { key: "budget", label: "Budget", blurb: "Overages and adjustments." },
  { key: "investing", label: "Investing", blurb: "Performance and allocation." },
  { key: "portfolio", label: "Portfolio", blurb: "Concrete rebalancing ideas." },
  { key: "trading", label: "Trading", blurb: "Win rate, R, and mistakes." },
] as const;

function CoachPage() {
  const fn = useServerFn(runCoach);
  const [scope, setScope] = useState<(typeof SCOPES)[number]["key"]>("full");
  const analyze = useMutation({
    mutationFn: (s: (typeof SCOPES)[number]["key"]) => fn({ data: { scope: s } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="px-5 pt-8 pb-8">
      <header className="mb-6">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">AI financial coach</span>
        <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Origin.</h1>
        <p className="text-sm text-ink/60 max-w-[35ch] mt-2">Ask for a focused reading of any part of your financial life.</p>
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
            <Sparkles className="size-3.5 text-accent" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-ink/60">Origin · {scope}</span>
          </div>
          <p className="font-serif italic text-lg leading-snug mb-5">"{analyze.data.insight}"</p>
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-ink/10 text-xs">
            <Metric label="Net cash flow" value={fmtSigned(analyze.data.summary.cashflow.net)} />
            <Metric label="Net worth" value={fmt(analyze.data.summary.netWorth)} />
            <Metric label="Portfolio value" value={fmt(analyze.data.summary.portfolio.value)} />
            <Metric label="Portfolio P/L" value={fmtSigned(analyze.data.summary.portfolio.pnl)} />
            {analyze.data.summary.trading.count > 0 && (
              <>
                <Metric label="Win rate" value={`${analyze.data.summary.trading.winRate}%`} />
                <Metric label="Avg R" value={String(analyze.data.summary.trading.avgR ?? "—")} />
              </>
            )}
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

function fmt(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}
function fmtSigned(n: number) {
  return `${n >= 0 ? "+" : "−"}$${Math.abs(Math.round(n)).toLocaleString()}`;
}
