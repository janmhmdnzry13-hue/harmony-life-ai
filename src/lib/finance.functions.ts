import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const txSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["income", "expense"]),
  amount: z.number().nonnegative().max(1_000_000_000),
  currency: z.string().min(1).max(6).default("USD"),
  category: z.string().min(1).max(40).default("other"),
  note: z.string().max(300).optional().nullable(),
  occurred_on: z.string().optional(),
});

const budgetSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(1).max(40),
  amount: z.number().nonnegative().max(1_000_000_000),
  currency: z.string().min(1).max(6).default("USD"),
  month: z.string(), // YYYY-MM-01
});

export const listFinance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthISO = monthStart.toISOString().slice(0, 10);

    const [tx, bud] = await Promise.all([
      context.supabase
        .from("transactions")
        .select("*")
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase.from("budgets").select("*").eq("month", monthISO),
    ]);
    if (tx.error) throw new Error(tx.error.message);
    if (bud.error) throw new Error(bud.error.message);
    return { transactions: tx.data ?? [], budgets: bud.data ?? [], month: monthISO };
  });

export const upsertTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => txSchema.parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("transactions").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("transactions").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("transactions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => budgetSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("budgets")
      .upsert(
        { ...data, user_id: context.userId },
        { onConflict: "user_id,category,month" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("budgets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const analyzeSpending = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthISO = monthStart.toISOString().slice(0, 10);

    const [tx, bud] = await Promise.all([
      context.supabase
        .from("transactions")
        .select("type,amount,category,occurred_on,note")
        .gte("occurred_on", monthISO)
        .limit(500),
      context.supabase.from("budgets").select("category,amount").eq("month", monthISO),
    ]);
    if (tx.error) throw new Error(tx.error.message);
    if (bud.error) throw new Error(bud.error.message);

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const totals = { income: 0, expense: 0 } as Record<string, number>;
    const byCategory: Record<string, number> = {};
    for (const t of tx.data ?? []) {
      const amt = Number(t.amount);
      totals[t.type] = (totals[t.type] ?? 0) + amt;
      if (t.type === "expense") byCategory[t.category] = (byCategory[t.category] ?? 0) + amt;
    }

    const gateway = createLovableAiGatewayProvider(key);
    const summary = {
      month: monthISO,
      income: totals.income,
      expense: totals.expense,
      net: totals.income - totals.expense,
      byCategory,
      budgets: (bud.data ?? []).map((b) => ({ category: b.category, amount: Number(b.amount) })),
      recent: (tx.data ?? []).slice(0, 30),
    };

    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system:
        "You are Origin, a calm, concise personal finance coach. Respond in 2-3 short sentences (max 55 words). Highlight one concrete insight, one gentle nudge. No bullet lists. No emojis. Sound editorial and warm.",
      prompt:
        "Analyze this month's spending JSON and produce a single-paragraph insight for the user:\n" +
        JSON.stringify(summary),
    });

    return { insight: text.trim(), totals: summary };
  });
