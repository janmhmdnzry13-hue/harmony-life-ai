import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ASSET_TYPES = ["stock", "crypto", "etf", "gold", "real_estate", "other"] as const;

const schema = z.object({
  id: z.string().uuid().optional(),
  account_id: z.string().uuid().optional().nullable(),
  asset_type: z.enum(ASSET_TYPES).default("stock"),
  symbol: z.string().min(1).max(40),
  name: z.string().max(120).optional().nullable(),
  quantity: z.number().nonnegative(),
  avg_cost: z.number().nonnegative(),
  currency: z.string().min(1).max(6).default("USD"),
  notes: z.string().max(500).optional().nullable(),
});

const dividendSchema = z.object({
  id: z.string().uuid().optional(),
  holding_id: z.string().uuid().optional().nullable(),
  symbol: z.string().min(1).max(40),
  amount: z.number().nonnegative(),
  currency: z.string().min(1).max(6).default("USD"),
  paid_on: z.string(),
  note: z.string().max(300).optional().nullable(),
});

export const listHoldings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [h, d] = await Promise.all([
      context.supabase.from("holdings").select("*").order("created_at", { ascending: false }),
      context.supabase.from("dividends").select("*").order("paid_on", { ascending: false }).limit(200),
    ]);
    if (h.error) throw new Error(h.error.message);
    if (d.error) throw new Error(d.error.message);
    return { holdings: h.data ?? [], dividends: d.data ?? [] };
  });

export const upsertHolding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => schema.parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("holdings").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("holdings").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteHolding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("holdings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addDividend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => dividendSchema.parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("dividends").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("dividends").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteDividend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dividends").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Refresh live prices via CoinGecko (crypto) and Yahoo Finance (stock/etf/gold).
export const refreshPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: holdings, error } = await context.supabase
      .from("holdings")
      .select("id,symbol,asset_type");
    if (error) throw new Error(error.message);
    if (!holdings?.length) return { updated: 0 };

    const cryptoSyms = holdings.filter((h) => h.asset_type === "crypto").map((h) => h.symbol.toLowerCase());
    const yahooSyms = holdings
      .filter((h) => ["stock", "etf", "gold"].includes(h.asset_type))
      .map((h) => h.symbol.toUpperCase());

    const priceMap = new Map<string, number>();

    // Crypto: CoinGecko simple/price using IDs (symbols). Use symbol lookup fallback.
    if (cryptoSyms.length) {
      try {
        const ids = cryptoSyms.join(",");
        const r = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd`,
        );
        if (r.ok) {
          const j = (await r.json()) as Record<string, { usd?: number }>;
          for (const [id, v] of Object.entries(j)) {
            if (typeof v.usd === "number") priceMap.set(`crypto:${id.toLowerCase()}`, v.usd);
          }
        }
      } catch {
        /* ignore */
      }
    }

    if (yahooSyms.length) {
      try {
        const r = await fetch(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSyms.join(","))}`,
          { headers: { "User-Agent": "Mozilla/5.0" } },
        );
        if (r.ok) {
          const j = (await r.json()) as { quoteResponse?: { result?: Array<{ symbol: string; regularMarketPrice?: number }> } };
          for (const q of j.quoteResponse?.result ?? []) {
            if (typeof q.regularMarketPrice === "number") {
              priceMap.set(`sym:${q.symbol.toUpperCase()}`, q.regularMarketPrice);
            }
          }
        }
      } catch {
        /* ignore */
      }
    }

    let updated = 0;
    const now = new Date().toISOString();
    for (const h of holdings) {
      const key =
        h.asset_type === "crypto"
          ? `crypto:${h.symbol.toLowerCase()}`
          : `sym:${h.symbol.toUpperCase()}`;
      const price = priceMap.get(key);
      if (price != null) {
        await context.supabase
          .from("holdings")
          .update({ current_price: price, price_updated_at: now })
          .eq("id", h.id);
        updated++;
      }
    }
    return { updated };
  });
