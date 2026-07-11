import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Sparkles, Trash2, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listFinance,
  upsertTransaction,
  deleteTransaction,
  upsertBudget,
  deleteBudget,
  analyzeSpending,
} from "@/lib/finance.functions";

export const Route = createFileRoute("/_authenticated/finance")({
  component: FinancePage,
});

type TxInput = {
  type: "income" | "expense";
  amount: number;
  currency: string;
  category: string;
  note: string | null;
  occurred_on: string;
};
type BudgetInput = { category: string; amount: number; currency: string; month: string };


const CATEGORIES = [
  "food",
  "transport",
  "housing",
  "shopping",
  "entertainment",
  "health",
  "bills",
  "savings",
  "other",
];

function FinancePage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listFinance);
  const upTx = useServerFn(upsertTransaction);
  const delTx = useServerFn(deleteTransaction);
  const upBud = useServerFn(upsertBudget);
  const delBud = useServerFn(deleteBudget);
  const analyzeFn = useServerFn(analyzeSpending);

  const q = useQuery({ queryKey: ["finance"], queryFn: () => listFn() });
  const analyze = useMutation({
    mutationFn: () => analyzeFn(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Analysis failed"),
  });

  const [txOpen, setTxOpen] = useState(false);
  const [budOpen, setBudOpen] = useState(false);

  const transactions = q.data?.transactions ?? [];
  const budgets = q.data?.budgets ?? [];
  const month = q.data?.month ?? format(new Date(), "yyyy-MM-01");
  const currency = transactions[0]?.currency ?? budgets[0]?.currency ?? "USD";

  const totals = useMemo(() => {
    const monthTx = transactions.filter((t) => t.occurred_on >= month);
    let income = 0;
    let expense = 0;
    const byCat: Record<string, number> = {};
    for (const t of monthTx) {
      const a = Number(t.amount);
      if (t.type === "income") income += a;
      else {
        expense += a;
        byCat[t.category] = (byCat[t.category] ?? 0) + a;
      }
    }
    return { income, expense, net: income - expense, byCat };
  }, [transactions, month]);

  const createTx = useMutation({
    mutationFn: (v: TxInput) => upTx({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance"] });
      setTxOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const removeTx = useMutation({
    mutationFn: (id: string) => delTx({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance"] }),
  });
  const saveBudget = useMutation({
    mutationFn: (v: BudgetInput) => upBud({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance"] });
      setBudOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const removeBudget = useMutation({
    mutationFn: (id: string) => delBud({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance"] }),
  });

  return (
    <div className="px-5 pt-12 pb-8">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">
            {format(parseISO(month), "MMMM yyyy")}
          </span>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Finance.</h1>
          <p className="text-sm text-ink/60 max-w-[35ch] mt-2">
            Money is attention. Track it, and it starts to answer back.
          </p>
        </div>
        <button
          onClick={() => setTxOpen(true)}
          className="size-11 bg-ink text-paper border border-ink flex items-center justify-center shrink-0"
          aria-label="Add transaction"
        >
          <Plus className="size-5" />
        </button>
      </header>

      {/* Net card */}
      <section className="mb-6 border border-ink/10">
        <div className="p-5 border-b border-ink/10">
          <p className="text-[10px] font-medium uppercase tracking-widest text-ink/40 mb-2">
            Net this month
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl leading-none tracking-tight">
              {formatMoney(totals.net, currency)}
            </span>
            <span
              className={`text-xs font-medium ${totals.net >= 0 ? "text-accent" : "text-destructive"}`}
            >
              {totals.net >= 0 ? "surplus" : "deficit"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-ink/10">
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ink/40 mb-1">
              <ArrowDownLeft className="size-3" /> Income
            </div>
            <p className="font-serif text-xl">{formatMoney(totals.income, currency)}</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ink/40 mb-1">
              <ArrowUpRight className="size-3" /> Spent
            </div>
            <p className="font-serif text-xl">{formatMoney(totals.expense, currency)}</p>
          </div>
        </div>
      </section>

      {/* AI insight card */}
      <section className="mb-6 p-5 bg-ink text-paper">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="size-3.5 text-accent" />
          <span className="text-[10px] font-medium uppercase tracking-widest opacity-60">
            Origin · spending analysis
          </span>
        </div>
        {analyze.data ? (
          <p className="font-serif italic text-lg leading-snug mb-4">"{analyze.data.insight}"</p>
        ) : (
          <p className="font-serif italic text-base leading-snug opacity-70 mb-4">
            Ask Origin to read your month and surface one insight worth acting on.
          </p>
        )}
        <button
          onClick={() => analyze.mutate()}
          disabled={analyze.isPending || transactions.length === 0}
          className="inline-flex items-center gap-2 text-xs bg-paper text-ink px-3 py-1.5 font-medium disabled:opacity-40"
        >
          {analyze.isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Reading…
            </>
          ) : analyze.data ? (
            "Re-analyze"
          ) : (
            "Analyze this month"
          )}
        </button>
        {transactions.length === 0 && (
          <p className="text-[10px] uppercase tracking-widest opacity-50 mt-3">
            Add a transaction to unlock analysis.
          </p>
        )}
      </section>

      {/* Budgets */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40">
            Budgets
          </h3>
          <button
            onClick={() => setBudOpen(true)}
            className="text-[10px] uppercase tracking-widest text-ink/60"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {budgets.length === 0 && (
            <p className="text-sm text-ink/40 py-2">No budgets yet. Set a monthly limit.</p>
          )}
          {budgets.map((b) => {
            const spent = totals.byCat[b.category] ?? 0;
            const limit = Number(b.amount);
            const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
            const over = spent > limit;
            return (
              <div key={b.id} className="p-4 border border-ink/10 group">
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <p className="text-sm capitalize font-medium">{b.category}</p>
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">
                      {formatMoney(spent, b.currency)} of {formatMoney(limit, b.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-serif text-lg ${over ? "text-destructive" : "text-ink"}`}
                    >
                      {pct}%
                    </span>
                    <button
                      onClick={() => removeBudget.mutate(b.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-ink/40"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="h-1.5 bg-ink/10">
                  <div
                    className={`h-full ${over ? "bg-destructive" : "bg-ink"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent */}
      <section>
        <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40 mb-3">
          Recent activity
        </h3>
        <div className="divide-y divide-ink/10">
          {transactions.length === 0 && (
            <p className="text-sm text-ink/40 py-6 text-center font-serif italic">
              Nothing recorded yet.
            </p>
          )}
          {transactions.slice(0, 30).map((t) => (
            <div key={t.id} className="py-3 flex items-center gap-3 group">
              <div
                className={`size-8 border flex items-center justify-center ${
                  t.type === "income"
                    ? "border-accent/40 text-accent"
                    : "border-ink/20 text-ink/70"
                }`}
              >
                {t.type === "income" ? (
                  <ArrowUpRight className="size-4" />
                ) : (
                  <ArrowDownRight className="size-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{t.note || t.category}</p>
                <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">
                  {t.category} · {format(parseISO(t.occurred_on), "MMM d")}
                </p>
              </div>
              <span
                className={`font-serif tabular-nums ${
                  t.type === "income" ? "text-accent" : "text-ink"
                }`}
              >
                {t.type === "income" ? "+" : "−"}
                {formatMoney(Number(t.amount), t.currency)}
              </span>
              <button
                onClick={() => removeTx.mutate(t.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-ink/40"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {txOpen && (
        <TransactionSheet
          onClose={() => setTxOpen(false)}
          onSubmit={(v) => createTx.mutate(v)}
          pending={createTx.isPending}
          currency={currency}
        />
      )}
      {budOpen && (
        <BudgetSheet
          month={month}
          onClose={() => setBudOpen(false)}
          onSubmit={(v) => saveBudget.mutate(v)}
          pending={saveBudget.isPending}
          currency={currency}
        />
      )}
    </div>
  );
}

function TransactionSheet({
  onClose,
  onSubmit,
  pending,
  currency,
}: {
  onClose: () => void;
  onSubmit: (v: {
    type: "income" | "expense";
    amount: number;
    currency: string;
    category: string;
    note: string | null;
    occurred_on: string;
  }) => void;
  pending: boolean;
  currency: string;
}) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  return (
    <Sheet onClose={onClose} title="New transaction">
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`py-2.5 text-xs uppercase tracking-widest font-medium border ${
              type === t ? "bg-ink text-paper border-ink" : "border-ink/20"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <label className="block text-[10px] uppercase tracking-widest text-ink/40 mb-2">
        Amount ({currency})
      </label>
      <input
        autoFocus
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
        className="w-full bg-surface border border-ink/10 px-3 py-3 font-serif text-2xl mb-3 focus:outline-none focus:border-ink/40"
      />
      <label className="block text-[10px] uppercase tracking-widest text-ink/40 mb-2">Category</label>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-2.5 py-1 text-xs capitalize border ${
              category === c ? "bg-ink text-paper border-ink" : "border-ink/15 text-ink/70"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        placeholder="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3 focus:outline-none focus:border-ink/40"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-4 focus:outline-none focus:border-ink/40"
      />
      <button
        disabled={!amount || Number(amount) <= 0 || pending}
        onClick={() =>
          onSubmit({
            type,
            amount: Number(amount),
            currency,
            category,
            note: note || null,
            occurred_on: date,
          })
        }
        className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40"
      >
        Save
      </button>
    </Sheet>
  );
}

function BudgetSheet({
  month,
  onClose,
  onSubmit,
  pending,
  currency,
}: {
  month: string;
  onClose: () => void;
  onSubmit: (v: { category: string; amount: number; currency: string; month: string }) => void;
  pending: boolean;
  currency: string;
}) {
  const [category, setCategory] = useState("food");
  const [amount, setAmount] = useState("");

  return (
    <Sheet onClose={onClose} title={`Budget · ${format(parseISO(month), "MMMM")}`}>
      <label className="block text-[10px] uppercase tracking-widest text-ink/40 mb-2">Category</label>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-2.5 py-1 text-xs capitalize border ${
              category === c ? "bg-ink text-paper border-ink" : "border-ink/15 text-ink/70"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <label className="block text-[10px] uppercase tracking-widest text-ink/40 mb-2">
        Monthly limit ({currency})
      </label>
      <input
        autoFocus
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
        className="w-full bg-surface border border-ink/10 px-3 py-3 font-serif text-2xl mb-4 focus:outline-none focus:border-ink/40"
      />
      <button
        disabled={!amount || Number(amount) <= 0 || pending}
        onClick={() => onSubmit({ category, amount: Number(amount), currency, month })}
        className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40"
      >
        Save budget
      </button>
    </Sheet>
  );
}

function Sheet({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-2xl mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function formatMoney(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${Math.round(n)}`;
  }
}
