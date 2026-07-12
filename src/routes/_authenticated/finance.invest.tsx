import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Plus, Trash2, RefreshCw, Loader2, Coins } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  listHoldings,
  upsertHolding,
  deleteHolding,
  refreshPrices,
  addDividend,
  deleteDividend,
} from "@/lib/holdings.functions";

export const Route = createFileRoute("/_authenticated/finance/invest")({
  component: InvestPage,
});

const ASSET_TYPES = ["stock", "crypto", "etf", "gold", "real_estate", "other"] as const;

function InvestPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listHoldings);
  const upFn = useServerFn(upsertHolding);
  const delFn = useServerFn(deleteHolding);
  const refreshFn = useServerFn(refreshPrices);
  const divFn = useServerFn(addDividend);
  const divDelFn = useServerFn(deleteDividend);

  const q = useQuery({ queryKey: ["invest"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [divOpen, setDivOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | (typeof ASSET_TYPES)[number]>("all");

  const create = useMutation({
    mutationFn: (v: {
      asset_type: (typeof ASSET_TYPES)[number];
      symbol: string;
      name: string | null;
      quantity: number;
      avg_cost: number;
      currency: string;
      notes: string | null;
    }) => upFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invest"] }); setOpen(false); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const remove = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["invest"] }) });
  const refresh = useMutation({
    mutationFn: () => refreshFn(),
    onSuccess: (r) => { toast.success(`Updated ${r.updated} prices`); qc.invalidateQueries({ queryKey: ["invest"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const addDiv = useMutation({
    mutationFn: (v: { symbol: string; amount: number; currency: string; paid_on: string; note: string | null }) =>
      divFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["invest"] }); setDivOpen(false); },
  });
  const rmDiv = useMutation({ mutationFn: (id: string) => divDelFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["invest"] }) });

  const holdings = q.data?.holdings ?? [];
  const dividends = q.data?.dividends ?? [];

  const filtered = filter === "all" ? holdings : holdings.filter((h) => h.asset_type === filter);

  const stats = useMemo(() => {
    let value = 0, cost = 0;
    for (const h of holdings) {
      const p = Number(h.current_price ?? h.avg_cost);
      value += Number(h.quantity) * p;
      cost += Number(h.quantity) * Number(h.avg_cost);
    }
    const divTotal = dividends.reduce((s, d) => s + Number(d.amount), 0);
    return { value, cost, pnl: value - cost, pct: cost > 0 ? ((value - cost) / cost) * 100 : 0, divTotal };
  }, [holdings, dividends]);

  const currency = holdings[0]?.currency ?? "USD";

  return (
    <div className="px-5 pt-8 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">Portfolio</span>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Invest.</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refresh.mutate()} disabled={refresh.isPending || holdings.length === 0} className="size-11 border border-ink/20 flex items-center justify-center disabled:opacity-40" aria-label="Refresh prices">
            {refresh.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          </button>
          <button onClick={() => setOpen(true)} className="size-11 bg-ink text-paper border border-ink flex items-center justify-center" aria-label="Add holding"><Plus className="size-5" /></button>
        </div>
      </header>

      <section className="mb-6 border border-ink/10">
        <div className="p-5 border-b border-ink/10">
          <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-2">Portfolio value</p>
          <p className="font-serif text-4xl leading-none tracking-tight">{money(stats.value, currency)}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-sm font-medium ${stats.pnl >= 0 ? "text-foreground" : "text-destructive"}`}>
              {stats.pnl >= 0 ? "+" : "−"}{money(Math.abs(stats.pnl), currency)}
            </span>
            <span className={`text-xs ${stats.pnl >= 0 ? "text-foreground" : "text-destructive"}`}>({stats.pct.toFixed(2)}%)</span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-ink/10">
          <div className="p-4"><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Cost basis</p><p className="font-serif text-lg">{money(stats.cost, currency)}</p></div>
          <div className="p-4"><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Dividends</p><p className="font-serif text-lg text-foreground">{money(stats.divTotal, currency)}</p></div>
        </div>
      </section>

      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none">
        {(["all", ...ASSET_TYPES] as const).map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`shrink-0 px-2.5 py-1 text-xs capitalize border ${filter === t ? "bg-ink text-paper border-ink" : "border-ink/15 text-ink/70"}`}>{t.replace("_", " ")}</button>
        ))}
      </div>

      <section className="mb-8">
        <div className="divide-y divide-ink/10">
          {filtered.length === 0 && <p className="text-sm text-ink/40 py-4 italic font-serif">Nothing here yet.</p>}
          {filtered.map((h) => {
            const price = Number(h.current_price ?? h.avg_cost);
            const value = Number(h.quantity) * price;
            const cost = Number(h.quantity) * Number(h.avg_cost);
            const pnl = value - cost;
            return (
              <div key={h.id} className="py-3 flex items-center gap-3 group">
                <div className="size-9 border border-ink/15 flex items-center justify-center text-[10px] font-medium uppercase">{h.asset_type.slice(0, 2)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{h.symbol.toUpperCase()} <span className="text-ink/40 text-xs">· {Number(h.quantity)}</span></p>
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">avg {money(Number(h.avg_cost), h.currency)} · now {money(price, h.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif tabular-nums">{money(value, h.currency)}</p>
                  <p className={`text-[10px] tabular-nums ${pnl >= 0 ? "text-foreground" : "text-destructive"}`}>{pnl >= 0 ? "+" : "−"}{money(Math.abs(pnl), h.currency)}</p>
                </div>
                <button onClick={() => remove.mutate(h.id)} className="p-1 text-ink/40"><Trash2 className="size-3.5" /></button>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40">Dividends</h3>
          <button onClick={() => setDivOpen(true)} className="text-[10px] uppercase tracking-widest text-ink/60">+ Add</button>
        </div>
        <div className="divide-y divide-ink/10">
          {dividends.length === 0 && <p className="text-sm text-ink/40 py-2">No dividends recorded.</p>}
          {dividends.slice(0, 20).map((d) => (
            <div key={d.id} className="py-2.5 flex items-center gap-3">
              <Coins className="size-4 text-ink/40" />
              <div className="flex-1"><p className="text-sm">{d.symbol.toUpperCase()}</p><p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">{format(new Date(d.paid_on), "MMM d, yyyy")}</p></div>
              <span className="font-serif tabular-nums text-foreground">+{money(Number(d.amount), d.currency)}</span>
              <button onClick={() => rmDiv.mutate(d.id)} className="p-1 text-ink/40"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
        </div>
      </section>

      {open && <HoldingSheet onClose={() => setOpen(false)} onSubmit={(v) => create.mutate(v)} pending={create.isPending} />}
      {divOpen && <DividendSheet onClose={() => setDivOpen(false)} onSubmit={(v) => addDiv.mutate(v)} pending={addDiv.isPending} />}
    </div>
  );
}

function HoldingSheet({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (v: { asset_type: (typeof ASSET_TYPES)[number]; symbol: string; name: string | null; quantity: number; avg_cost: number; currency: string; notes: string | null }) => void; pending: boolean }) {
  const [type, setType] = useState<(typeof ASSET_TYPES)[number]>("stock");
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState("USD");
  return (
    <Sheet onClose={onClose} title="New holding">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ASSET_TYPES.map((t) => <button key={t} onClick={() => setType(t)} className={`px-2.5 py-1 text-xs capitalize border ${type === t ? "bg-ink text-paper border-ink" : "border-ink/15 text-ink/70"}`}>{t.replace("_", " ")}</button>)}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1.5">
        {type === "crypto" ? "CoinGecko ID (e.g. bitcoin, ethereum)" : "Ticker (e.g. AAPL, GLD)"}
      </p>
      <input autoFocus placeholder={type === "crypto" ? "bitcoin" : "AAPL"} value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3 focus:outline-none focus:border-ink/40" />
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1.5">Quantity</p><input inputMode="decimal" placeholder="0" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40" /></div>
        <div><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1.5">Avg cost</p><input inputMode="decimal" placeholder="0.00" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40" /></div>
      </div>
      <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 6))} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-4 focus:outline-none focus:border-ink/40" />
      <button disabled={!symbol || !qty || pending} onClick={() => onSubmit({ asset_type: type, symbol: symbol.trim(), name: null, quantity: Number(qty), avg_cost: Number(cost || "0"), currency, notes: null })} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">Save</button>
    </Sheet>
  );
}

function DividendSheet({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (v: { symbol: string; amount: number; currency: string; paid_on: string; note: string | null }) => void; pending: boolean }) {
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  return (
    <Sheet onClose={onClose} title="Dividend received">
      <input autoFocus placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3 focus:outline-none focus:border-ink/40" />
      <input inputMode="decimal" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full bg-surface border border-ink/10 px-3 py-3 font-serif text-xl mb-3 focus:outline-none focus:border-ink/40" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-4 focus:outline-none focus:border-ink/40" />
      <button disabled={!symbol || !amount || pending} onClick={() => onSubmit({ symbol, amount: Number(amount), currency: "USD", paid_on: date, note: null })} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">Save</button>
    </Sheet>
  );
}

function Sheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end" onClick={onClose}>
      <div className="w-full max-w-[480px] mx-auto bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-4">{title}</h2>{children}
      </div>
    </div>
  );
}

function money(n: number, currency: string) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n); }
  catch { return `${currency} ${n.toFixed(2)}`; }
}
