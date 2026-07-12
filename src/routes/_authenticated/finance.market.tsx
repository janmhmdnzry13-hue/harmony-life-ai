import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, Loader2, TrendingUp, TrendingDown, Calendar as CalIcon } from "lucide-react";
import { format } from "date-fns";
import { getMarketDashboard } from "@/lib/market.functions";

export const Route = createFileRoute("/_authenticated/finance/market")({
  component: MarketPage,
});

const CRYPTO_LABELS: Record<string, string> = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL", ripple: "XRP", cardano: "ADA", dogecoin: "DOGE",
};

const STOCK_LABELS: Record<string, string> = {
  "^GSPC": "S&P 500", "^IXIC": "Nasdaq", "^DJI": "Dow", "^VIX": "VIX",
  "GC=F": "Gold", "CL=F": "Crude Oil",
};

const KIND_LABELS: Record<string, string> = {
  CPI: "CPI", PPI: "PPI", FOMC: "FOMC", FED: "Fed", JOBS: "Jobs",
};

function MarketPage() {
  const fn = useServerFn(getMarketDashboard);
  const q = useQuery({ queryKey: ["market"], queryFn: () => fn(), staleTime: 60_000, refetchOnWindowFocus: false });

  return (
    <div className="px-5 pt-8 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">Live markets</span>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Market.</h1>
        </div>
        <button onClick={() => q.refetch()} disabled={q.isFetching} className="size-11 border border-ink/20 flex items-center justify-center disabled:opacity-40" aria-label="Refresh">
          {q.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        </button>
      </header>

      {q.isLoading && <p className="text-sm text-ink/40 py-8 text-center">Loading market data…</p>}

      {q.data && (
        <>
          <section className="mb-6 grid grid-cols-3 border border-ink/10 divide-x divide-ink/10">
            <IndexBox label="Fear & Greed" value={q.data.fearGreed?.value ?? null} sub={q.data.fearGreed?.classification} />
            <IndexBox label="BTC Dom" value={q.data.btcDominance != null ? Math.round(q.data.btcDominance) : null} suffix="%" />
            <IndexBox label="Alt Season" value={q.data.altSeason} suffix="%" sub={q.data.altSeason != null ? (q.data.altSeason >= 75 ? "altseason" : q.data.altSeason <= 25 ? "btc season" : "neutral") : undefined} />
          </section>

          <section className="mb-6">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-3">Crypto</h3>
            <div className="divide-y divide-ink/10">
              {q.data.cryptoPrices.map((c) => (
                <PriceRow key={c.id} label={CRYPTO_LABELS[c.id] ?? c.id.toUpperCase()} name={c.id} price={c.price} change={c.change24h} />
              ))}
            </div>
          </section>

          <section className="mb-6">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-3">Stocks & commodities</h3>
            <div className="divide-y divide-ink/10">
              {q.data.stockQuotes.map((s) => (
                <PriceRow key={s.symbol} label={STOCK_LABELS[s.symbol] ?? s.symbol} name={s.symbol} price={s.price} change={s.change} />
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-3">Economic calendar</h3>
            <div className="divide-y divide-ink/10">
              {q.data.calendar.length === 0 && <p className="text-sm text-ink/40 py-2">No upcoming events.</p>}
              {q.data.calendar.map((e, i) => (
                <div key={i} className="py-3 flex items-center gap-3">
                  <div className="size-9 border border-ink/15 flex items-center justify-center text-[9px] font-medium uppercase tracking-widest">{KIND_LABELS[e.kind] ?? e.kind}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{e.title}</p>
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5 flex items-center gap-1"><CalIcon className="size-3" /> {format(new Date(e.date), "EEE, MMM d")}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <p className="text-[10px] uppercase tracking-widest text-ink/30 mt-8 text-center">Updated {format(new Date(q.data.updatedAt), "MMM d, HH:mm")}</p>
        </>
      )}
    </div>
  );
}

function IndexBox({ label, value, suffix, sub }: { label: string; value: number | null; suffix?: string; sub?: string }) {
  return (
    <div className="p-4">
      <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">{label}</p>
      <p className="font-serif text-2xl">{value != null ? `${value}${suffix ?? ""}` : "—"}</p>
      {sub && <p className="text-[10px] uppercase tracking-widest text-ink/50 mt-1">{sub}</p>}
    </div>
  );
}

function PriceRow({ label, name, price, change }: { label: string; name: string; price: number; change: number }) {
  const up = change >= 0;
  return (
    <div className="py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm">{label}</p>
        <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">{name}</p>
      </div>
      <div className="text-right">
        <p className="font-serif tabular-nums">{price >= 1000 ? price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : price.toFixed(2)}</p>
        <p className={`text-[10px] tabular-nums flex items-center gap-0.5 justify-end ${up ? "text-foreground" : "text-destructive"}`}>
          {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />} {up ? "+" : ""}{change.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
