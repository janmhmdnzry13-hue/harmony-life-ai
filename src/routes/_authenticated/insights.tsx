import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getScoreHistory, listInsights } from "@/lib/intelligence.functions";
import { listFinance } from "@/lib/finance.functions";
import { Sparkline } from "@/components/score-ring";
import { BookOpen, Gauge, Heart, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Origin Life OS" },
      { name: "description", content: "Weekly summaries of your health, money and focus." },
      { property: "og:title", content: "Insights — Origin Life OS" },
      { property: "og:description", content: "Weekly summaries of your health, money and focus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const historyFn = useServerFn(getScoreHistory);
  const insightsFn = useServerFn(listInsights);
  const financeFn = useServerFn(listFinance);

  const history = useQuery({ queryKey: ["score-history"], queryFn: () => historyFn() });
  const insights = useQuery({ queryKey: ["insights"], queryFn: () => insightsFn() });
  const finance = useQuery({ queryKey: ["finance"], queryFn: () => financeFn() });

  const rows = history.data ?? [];
  const latest = rows[rows.length - 1];
  const life = Math.round(Number(latest?.life_score ?? 0));
  const points = rows.map((r) => Number(r.life_score ?? 0));

  const month = new Date().toISOString().slice(0, 7);
  const tx = (finance.data?.transactions ?? []).filter((t) => t.occurred_on.slice(0, 7) === month);
  const spent = tx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const bars = [
    { label: "Health", value: Number(latest?.health_score ?? 0) },
    { label: "Money", value: Number(latest?.finance_score ?? 0) },
    { label: "Focus", value: Number(latest?.productivity_score ?? 0) },
    { label: "Joy", value: Number(latest?.happiness_score ?? 0) },
  ];

  return (
    <div className="px-5 pt-8 pb-4 space-y-4">
      <header className="px-1 pb-2 rise">
        <p className="label-quiet">Insights</p>
        <h1 className="mt-2 font-serif text-[34px] leading-tight tracking-tight">How life is going.</h1>
      </header>

      {/* Life score */}
      <section className="card-soft p-6 rise">
        <p className="label-quiet">Life score</p>
        <div className="mt-2 flex items-end gap-3">
          <span className="font-serif text-6xl leading-none tracking-tight">{life || "—"}</span>
          <span className="pb-2 text-xs text-muted-foreground">out of 100</span>
        </div>
        <div className="mt-5">
          <Sparkline points={points} />
        </div>
        <div className="mt-6 space-y-3.5">
          {bars.map((b) => (
            <div key={b.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{b.label}</span>
                <span className="text-muted-foreground">{Math.round(b.value)}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${Math.max(0, Math.min(100, b.value))}%`,
                    transition: "width 900ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <Link to="/intel" className="press mt-6 inline-flex text-sm font-semibold text-accent">
          Open intelligence →
        </Link>
      </section>

      {/* This week */}
      <section className="card-soft p-6 rise">
        <p className="label-quiet">This month</p>
        <p className="mt-3 font-serif text-2xl">{Math.round(spent).toLocaleString()}</p>
        <p className="mt-1 text-xs text-muted-foreground">spent across {tx.length} entries</p>
      </section>

      {/* Recommendations */}
      {(insights.data ?? []).length > 0 && (
        <section className="card-soft p-6 rise">
          <p className="label-quiet">Recommendations</p>
          <ul className="mt-4 space-y-5">
            {(insights.data ?? []).slice(0, 4).map((i) => (
              <li key={i.id}>
                <p className="text-[15px] font-medium leading-snug">{i.title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{i.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-4">
        {[
          { to: "/wellness", label: "Health", icon: Heart },
          { to: "/finance", label: "Money", icon: Wallet },
          { to: "/wellness/learn", label: "Learning", icon: BookOpen },
          { to: "/intel", label: "Intelligence", icon: Gauge },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.to} to={c.to as never} className="press card-soft p-5 rise">
              <Icon className="size-4 text-accent" strokeWidth={1.9} />
              <p className="mt-3 font-serif text-lg">{c.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
