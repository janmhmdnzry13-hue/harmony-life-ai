import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { z } from "zod";

const scopeSchema = z.object({
  scope: z.enum(["spending", "investing", "portfolio", "budget", "trading", "full"]).default("full"),
});

export const runCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => scopeSchema.parse(v))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthISO = monthStart.toISOString().slice(0, 10);

    const [tx, bud, acc, hold, tr, bills, goals] = await Promise.all([
      context.supabase
        .from("transactions")
        .select("type,amount,category,occurred_on")
        .gte("occurred_on", monthISO)
        .limit(500),
      context.supabase.from("budgets").select("category,amount").eq("month", monthISO),
      context.supabase.from("accounts").select("name,type,balance,currency"),
      context.supabase.from("holdings").select("asset_type,symbol,quantity,avg_cost,current_price,currency"),
      context.supabase.from("trades").select("pnl,r_multiple,mistakes,closed_at").not("closed_at", "is", null).limit(100),
      context.supabase.from("bills").select("name,amount,cycle,category,is_active"),
      context.supabase.from("savings_goals").select("name,target_amount,current_amount"),
    ]);

    const income = (tx.data ?? []).filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = (tx.data ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const byCat: Record<string, number> = {};
    for (const t of tx.data ?? []) if (t.type === "expense") byCat[t.category] = (byCat[t.category] ?? 0) + Number(t.amount);

    const portfolioValue = (hold.data ?? []).reduce(
      (s, h) => s + Number(h.quantity) * Number(h.current_price ?? h.avg_cost),
      0,
    );
    const portfolioCost = (hold.data ?? []).reduce((s, h) => s + Number(h.quantity) * Number(h.avg_cost), 0);
    const allocation: Record<string, number> = {};
    for (const h of hold.data ?? []) {
      const v = Number(h.quantity) * Number(h.current_price ?? h.avg_cost);
      allocation[h.asset_type] = (allocation[h.asset_type] ?? 0) + v;
    }

    const netWorth = (acc.data ?? []).reduce(
      (s, a) => s + (a.type === "liability" ? -1 : 1) * Number(a.balance),
      0,
    ) + portfolioValue;

    const closed = tr.data ?? [];
    const wins = closed.filter((t) => (t.pnl ?? 0) > 0).length;
    const winRate = closed.length ? Math.round((wins / closed.length) * 100) : null;
    const avgR = closed.length
      ? Number((closed.reduce((s, t) => s + Number(t.r_multiple ?? 0), 0) / closed.length).toFixed(2))
      : null;
    const mistakeCounts: Record<string, number> = {};
    for (const t of closed) for (const m of t.mistakes ?? []) mistakeCounts[m] = (mistakeCounts[m] ?? 0) + 1;

    const summary = {
      month: monthISO,
      cashflow: { income, expense, net: income - expense },
      spendingByCategory: byCat,
      budgets: bud.data ?? [],
      bills: bills.data ?? [],
      goals: goals.data ?? [],
      accounts: acc.data ?? [],
      portfolio: {
        value: Math.round(portfolioValue),
        cost: Math.round(portfolioCost),
        pnl: Math.round(portfolioValue - portfolioCost),
        allocation,
      },
      netWorth: Math.round(netWorth),
      trading: { count: closed.length, winRate, avgR, topMistakes: mistakeCounts },
    };

    const system: Record<typeof data.scope, string> = {
      spending: "Focus only on spending patterns this month. 2-3 sentences.",
      investing: "Focus only on investment performance and asset allocation. 2-3 sentences.",
      portfolio: "Suggest concrete portfolio adjustments. Reference actual allocation percentages. 2-3 sentences.",
      budget: "Suggest budget optimizations. Reference actual overages. 2-3 sentences.",
      trading: "Analyze trading stats: win rate, avg R, most common mistakes. 2-3 sentences.",
      full: "Give a single-paragraph holistic financial coaching insight covering cash flow, portfolio, and one concrete next step. 3-4 sentences.",
    };

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system:
        "You are Origin, a calm, precise financial coach. Editorial tone. No bullet lists, no emojis. Reference specific numbers when they matter. " +
        system[data.scope],
      prompt: "User data JSON:\n" + JSON.stringify(summary),
    });

    return { insight: text.trim(), summary };
  });
