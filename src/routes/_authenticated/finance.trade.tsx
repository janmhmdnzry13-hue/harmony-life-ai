import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Plus, Trash2, Calculator } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { listTrades, upsertTrade, deleteTrade } from "@/lib/trading.functions";

export const Route = createFileRoute("/_authenticated/finance/trade")({
  component: TradePage,
});

const MISTAKE_TAGS = ["fomo", "no stop", "moved stop", "revenge", "oversized", "against trend", "chased", "no plan"];

function TradePage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTrades);
  const upFn = useServerFn(upsertTrade);
  const delFn = useServerFn(deleteTrade);
  const q = useQuery({ queryKey: ["trades"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  const create = useMutation({
    mutationFn: (v: TradeInput) => upFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trades"] }); setOpen(false); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const remove = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["trades"] }) });

  const trades = q.data ?? [];
  const closed = trades.filter((t) => t.closed_at);
  const open_ = trades.filter((t) => !t.closed_at);

  const stats = useMemo(() => {
    if (!closed.length) return { winRate: 0, avgR: 0, totalPnl: 0, best: 0, worst: 0 };
    const wins = closed.filter((t) => Number(t.pnl ?? 0) > 0).length;
    const totalPnl = closed.reduce((s, t) => s + Number(t.pnl ?? 0), 0);
    const avgR = closed.reduce((s, t) => s + Number(t.r_multiple ?? 0), 0) / closed.length;
    const best = Math.max(...closed.map((t) => Number(t.pnl ?? 0)));
    const worst = Math.min(...closed.map((t) => Number(t.pnl ?? 0)));
    return { winRate: Math.round((wins / closed.length) * 100), avgR, totalPnl, best, worst };
  }, [closed]);

  const mistakeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of trades) for (const m of t.mistakes ?? []) c[m] = (c[m] ?? 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [trades]);

  return (
    <div className="px-5 pt-8 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">Trading journal</span>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Trade.</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCalcOpen(true)} className="size-11 border border-ink/20 flex items-center justify-center" aria-label="Position size"><Calculator className="size-4" /></button>
          <button onClick={() => setOpen(true)} className="size-11 bg-ink text-paper border border-ink flex items-center justify-center" aria-label="New trade"><Plus className="size-5" /></button>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-3 border border-ink/10 divide-x divide-ink/10">
        <div className="p-4"><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Win rate</p><p className="font-serif text-2xl">{stats.winRate}%</p></div>
        <div className="p-4"><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Avg R</p><p className={`font-serif text-2xl ${stats.avgR >= 0 ? "text-foreground" : "text-destructive"}`}>{stats.avgR.toFixed(2)}</p></div>
        <div className="p-4"><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">Net P/L</p><p className={`font-serif text-2xl ${stats.totalPnl >= 0 ? "text-foreground" : "text-destructive"}`}>{stats.totalPnl >= 0 ? "+" : "−"}${Math.abs(stats.totalPnl).toFixed(0)}</p></div>
      </section>

      {mistakeCounts.length > 0 && (
        <section className="mb-6 p-4 border border-ink/10">
          <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-2">Mistake analysis</p>
          <div className="flex flex-wrap gap-1.5">
            {mistakeCounts.map(([m, c]) => (
              <span key={m} className="text-xs border border-ink/15 px-2 py-1">{m} <span className="text-ink/50">· {c}</span></span>
            ))}
          </div>
        </section>
      )}

      {open_.length > 0 && (
        <section className="mb-6">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-3">Open positions</h3>
          <div className="divide-y divide-ink/10">
            {open_.map((t) => (
              <TradeRow key={t.id} t={t} onDelete={() => remove.mutate(t.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-3">Trade history</h3>
        <div className="divide-y divide-ink/10">
          {closed.length === 0 && <p className="text-sm text-ink/40 py-4 italic font-serif">No closed trades yet.</p>}
          {closed.map((t) => <TradeRow key={t.id} t={t} onDelete={() => remove.mutate(t.id)} />)}
        </div>
      </section>

      {open && <TradeSheet onClose={() => setOpen(false)} onSubmit={(v) => create.mutate(v)} pending={create.isPending} />}
      {calcOpen && <PositionSizeSheet onClose={() => setCalcOpen(false)} />}
    </div>
  );
}

type TradeRow = { id: string; symbol: string; side: string; entry_price: number | string; exit_price: number | string | null; quantity: number | string; opened_at: string; closed_at: string | null; pnl: number | string | null; r_multiple: number | string | null; mistakes: string[]; rating: number | null };

function TradeRow({ t, onDelete }: { t: TradeRow; onDelete: () => void }) {
  const pnl = t.pnl != null ? Number(t.pnl) : null;
  const r = t.r_multiple != null ? Number(t.r_multiple) : null;
  return (
    <div className="py-3 flex items-center gap-3">
      <div className={`size-9 border flex items-center justify-center text-[10px] font-medium uppercase ${t.side === "long" ? "border-foreground/40 text-foreground" : "border-destructive/40 text-destructive"}`}>{t.side.slice(0, 1)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{t.symbol.toUpperCase()} <span className="text-ink/40 text-xs">· {Number(t.quantity)} @ {Number(t.entry_price)}</span></p>
        <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">{format(new Date(t.opened_at), "MMM d")}{t.closed_at && ` → ${format(new Date(t.closed_at), "MMM d")}`}</p>
      </div>
      {pnl != null ? (
        <div className="text-right">
          <p className={`font-serif tabular-nums ${pnl >= 0 ? "text-foreground" : "text-destructive"}`}>{pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(0)}</p>
          {r != null && <p className="text-[10px] text-ink/50 tabular-nums">{r.toFixed(2)}R</p>}
        </div>
      ) : (
        <span className="text-[10px] uppercase tracking-widest text-ink/40">open</span>
      )}
      <button onClick={onDelete} className="p-1 text-ink/40"><Trash2 className="size-3.5" /></button>
    </div>
  );
}

type TradeInput = { symbol: string; side: "long" | "short"; asset_type: string; entry_price: number; exit_price: number | null; quantity: number; stop_price: number | null; target_price: number | null; opened_at: string; closed_at: string | null; setup: string | null; mistakes: string[]; rating: number | null; notes: string | null; currency: string };

function TradeSheet({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (v: TradeInput) => void; pending: boolean }) {
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<"long" | "short">("long");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [qty, setQty] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [setup, setSetup] = useState("");
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  return (
    <Sheet onClose={onClose} title="New trade">
      <div className="grid grid-cols-2 gap-2 mb-3">
        {(["long", "short"] as const).map((s) => (
          <button key={s} onClick={() => setSide(s)} className={`py-2.5 text-xs uppercase tracking-widest font-medium border ${side === s ? "bg-ink text-paper border-ink" : "border-ink/20"}`}>{s}</button>
        ))}
      </div>
      <input autoFocus placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-2 focus:outline-none focus:border-ink/40" />
      <div className="grid grid-cols-3 gap-2 mb-2">
        <input inputMode="decimal" placeholder="Qty" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))} className="bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40" />
        <input inputMode="decimal" placeholder="Entry" value={entry} onChange={(e) => setEntry(e.target.value.replace(/[^0-9.]/g, ""))} className="bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40" />
        <input inputMode="decimal" placeholder="Exit" value={exit} onChange={(e) => setExit(e.target.value.replace(/[^0-9.]/g, ""))} className="bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input inputMode="decimal" placeholder="Stop" value={stop} onChange={(e) => setStop(e.target.value.replace(/[^0-9.]/g, ""))} className="bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40" />
        <input inputMode="decimal" placeholder="Target" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))} className="bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40" />
      </div>
      <input placeholder="Setup (e.g. breakout)" value={setup} onChange={(e) => setSetup(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3 focus:outline-none focus:border-ink/40" />
      <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1.5">Mistakes</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {MISTAKE_TAGS.map((m) => {
          const on = mistakes.includes(m);
          return <button key={m} onClick={() => setMistakes(on ? mistakes.filter((x) => x !== m) : [...mistakes, m])} className={`px-2 py-1 text-xs border ${on ? "bg-destructive text-paper border-destructive" : "border-ink/15 text-ink/70"}`}>{m}</button>;
        })}
      </div>
      <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-surface border border-ink/10 px-3 py-2 text-sm mb-4 focus:outline-none focus:border-ink/40" />
      <button disabled={!symbol || !qty || !entry || pending} onClick={() => onSubmit({
        symbol, side, asset_type: "stock",
        entry_price: Number(entry), exit_price: exit ? Number(exit) : null,
        quantity: Number(qty), stop_price: stop ? Number(stop) : null, target_price: target ? Number(target) : null,
        opened_at: new Date().toISOString(), closed_at: exit ? new Date().toISOString() : null,
        setup: setup || null, mistakes, rating: null, notes: notes || null, currency: "USD",
      })} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">Save trade</button>
    </Sheet>
  );
}

function PositionSizeSheet({ onClose }: { onClose: () => void }) {
  const [account, setAccount] = useState("10000");
  const [risk, setRisk] = useState("1");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");

  const a = Number(account) || 0;
  const rPct = Number(risk) || 0;
  const e = Number(entry) || 0;
  const s = Number(stop) || 0;
  const t = Number(target) || 0;
  const riskDollars = (a * rPct) / 100;
  const riskPerShare = Math.abs(e - s);
  const shares = riskPerShare > 0 ? Math.floor(riskDollars / riskPerShare) : 0;
  const rr = riskPerShare > 0 && t ? Math.abs(t - e) / riskPerShare : 0;

  return (
    <Sheet onClose={onClose} title="Position size">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1.5">Account ($)</p><input value={account} onChange={(e) => setAccount(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm" /></div>
        <div><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1.5">Risk (%)</p><input value={risk} onChange={(e) => setRisk(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm" /></div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1.5">Entry</p><input value={entry} onChange={(e) => setEntry(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm" /></div>
        <div><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1.5">Stop</p><input value={stop} onChange={(e) => setStop(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm" /></div>
        <div><p className="text-[10px] uppercase tracking-widest text-ink/40 mb-1.5">Target</p><input value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm" /></div>
      </div>
      <div className="bg-ink text-paper p-4 space-y-2">
        <div className="flex justify-between"><span className="text-[10px] uppercase tracking-widest opacity-60">Position size</span><span className="font-serif text-2xl">{shares.toLocaleString()}</span></div>
        <div className="flex justify-between text-sm"><span className="opacity-60">Risk</span><span className="tabular-nums">${riskDollars.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="opacity-60">Per share</span><span className="tabular-nums">${riskPerShare.toFixed(2)}</span></div>
        {rr > 0 && <div className="flex justify-between text-sm"><span className="opacity-60">R:R</span><span className="tabular-nums">{rr.toFixed(2)} : 1</span></div>}
      </div>
    </Sheet>
  );
}

function Sheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end" onClick={onClose}>
      <div className="w-full max-w-[480px] mx-auto bg-paper border-t border-ink/10 p-5 pb-10 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-4">{title}</h2>{children}
      </div>
    </div>
  );
}
