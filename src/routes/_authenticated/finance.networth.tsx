import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Plus, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { listAccounts, upsertAccount, deleteAccount } from "@/lib/networth.functions";

export const Route = createFileRoute("/_authenticated/finance/networth")({
  component: NetWorthPage,
});

const ACCOUNT_TYPES = [
  "cash",
  "checking",
  "savings",
  "brokerage",
  "crypto",
  "real_estate",
  "other",
  "liability",
] as const;

function NetWorthPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAccounts);
  const upFn = useServerFn(upsertAccount);
  const delFn = useServerFn(deleteAccount);
  const q = useQuery({ queryKey: ["networth"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);

  const create = useMutation({
    mutationFn: (v: { name: string; type: (typeof ACCOUNT_TYPES)[number]; balance: number; currency: string; notes: string | null }) =>
      upFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["networth"] }); setOpen(false); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["networth"] }),
  });

  const accounts = q.data?.accounts ?? [];
  const holdings = q.data?.holdings ?? [];

  const stats = useMemo(() => {
    const currency = accounts[0]?.currency ?? "USD";
    const assets = accounts.filter((a) => a.type !== "liability").reduce((s, a) => s + Number(a.balance), 0);
    const liabilities = accounts.filter((a) => a.type === "liability").reduce((s, a) => s + Number(a.balance), 0);
    const investments = holdings.reduce((s, h) => s + Number(h.quantity) * Number(h.current_price ?? h.avg_cost), 0);
    const allocation: Record<string, number> = { cash: 0 };
    for (const a of accounts) {
      if (a.type === "liability") continue;
      allocation[a.type] = (allocation[a.type] ?? 0) + Number(a.balance);
    }
    for (const h of holdings) {
      const v = Number(h.quantity) * Number(h.current_price ?? h.avg_cost);
      allocation[h.asset_type] = (allocation[h.asset_type] ?? 0) + v;
    }
    const total = assets + investments - liabilities;
    return { total, assets, liabilities, investments, allocation, currency };
  }, [accounts, holdings]);

  return (
    <div className="px-5 pt-8 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">Net worth</span>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Wealth.</h1>
        </div>
        <button onClick={() => setOpen(true)} className="size-11 bg-ink text-paper border border-ink flex items-center justify-center" aria-label="Add account">
          <Plus className="size-5" />
        </button>
      </header>

      <section className="mb-6 border border-ink/10 p-5">
        <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-2">Total net worth</p>
        <p className="font-serif text-4xl leading-none tracking-tight">{money(stats.total, stats.currency)}</p>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-ink/10 text-[10px] uppercase tracking-widest text-ink/40">
          <div><p>Assets</p><p className="font-serif text-lg text-ink normal-case tracking-normal mt-1">{money(stats.assets, stats.currency)}</p></div>
          <div><p>Invested</p><p className="font-serif text-lg text-ink normal-case tracking-normal mt-1">{money(stats.investments, stats.currency)}</p></div>
          <div><p>Debt</p><p className="font-serif text-lg text-destructive normal-case tracking-normal mt-1">{money(stats.liabilities, stats.currency)}</p></div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-3">Allocation</h3>
        <div className="space-y-2">
          {Object.entries(stats.allocation).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
            const denom = stats.assets + stats.investments;
            const pct = denom > 0 ? Math.round((v / denom) * 100) : 0;
            return (
              <div key={k} className="border border-ink/10 p-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="capitalize">{k.replace("_", " ")}</span>
                  <span className="font-serif">{pct}% · {money(v, stats.currency)}</span>
                </div>
                <div className="h-1 bg-ink/10"><div className="h-full bg-ink" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
          {Object.keys(stats.allocation).filter((k) => stats.allocation[k] > 0).length === 0 && (
            <p className="text-sm text-ink/40">Add accounts or holdings to see allocation.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-3">Accounts</h3>
        <div className="divide-y divide-ink/10">
          {accounts.length === 0 && <p className="text-sm text-ink/40 py-4 italic font-serif">No accounts yet.</p>}
          {accounts.map((a) => (
            <div key={a.id} className="py-3 flex items-center gap-3">
              <div className="size-9 border border-ink/15 flex items-center justify-center"><Building2 className="size-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{a.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">{a.type.replace("_", " ")}</p>
              </div>
              <span className={`font-serif tabular-nums ${a.type === "liability" ? "text-destructive" : ""}`}>
                {a.type === "liability" ? "−" : ""}{money(Number(a.balance), a.currency)}
              </span>
              <button onClick={() => remove.mutate(a.id)} className="p-1 text-ink/40"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
        </div>
      </section>

      {open && <AccountSheet onClose={() => setOpen(false)} onSubmit={(v) => create.mutate(v)} pending={create.isPending} />}
    </div>
  );
}

function AccountSheet({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (v: { name: string; type: (typeof ACCOUNT_TYPES)[number]; balance: number; currency: string; notes: string | null }) => void; pending: boolean }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof ACCOUNT_TYPES)[number]>("cash");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("USD");

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end" onClick={onClose}>
      <div className="w-full max-w-[480px] mx-auto bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl mb-4">New account</h2>
        <input autoFocus placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3 focus:outline-none focus:border-ink/40" />
        <div className="flex flex-wrap gap-1.5 mb-3">
          {ACCOUNT_TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} className={`px-2.5 py-1 text-xs capitalize border ${type === t ? "bg-ink text-paper border-ink" : "border-ink/15 text-ink/70"}`}>{t.replace("_", " ")}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <input inputMode="decimal" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value.replace(/[^0-9.-]/g, ""))} className="col-span-2 bg-surface border border-ink/10 px-3 py-3 font-serif text-xl focus:outline-none focus:border-ink/40" />
          <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 6))} className="bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40" />
        </div>
        <button disabled={!name || !balance || pending} onClick={() => onSubmit({ name, type, balance: Number(balance), currency, notes: null })} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">Save</button>
      </div>
    </div>
  );
}

function money(n: number, currency: string) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n); }
  catch { return `${currency} ${Math.round(n)}`; }
}
