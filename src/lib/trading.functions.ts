import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid().optional(),
  symbol: z.string().min(1).max(40),
  side: z.enum(["long", "short"]).default("long"),
  asset_type: z.string().max(20).default("stock"),
  entry_price: z.number().nonnegative(),
  exit_price: z.number().nullable().optional(),
  quantity: z.number().nonnegative(),
  stop_price: z.number().nullable().optional(),
  target_price: z.number().nullable().optional(),
  opened_at: z.string(),
  closed_at: z.string().nullable().optional(),
  setup: z.string().max(80).nullable().optional(),
  mistakes: z.array(z.string()).default([]),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(1500).nullable().optional(),
  currency: z.string().min(1).max(6).default("USD"),
});

function computePnl(t: z.infer<typeof schema>): { pnl: number | null; r: number | null } {
  if (t.exit_price == null) return { pnl: null, r: null };
  const dir = t.side === "long" ? 1 : -1;
  const pnl = (t.exit_price - t.entry_price) * dir * t.quantity;
  let r: number | null = null;
  if (t.stop_price != null) {
    const risk = Math.abs(t.entry_price - t.stop_price) * t.quantity;
    if (risk > 0) r = pnl / risk;
  }
  return { pnl: Number(pnl.toFixed(2)), r: r != null ? Number(r.toFixed(2)) : null };
}

export const listTrades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("trades")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => schema.parse(v))
  .handler(async ({ data, context }) => {
    const { pnl, r } = computePnl(data);
    const payload = { ...data, pnl, r_multiple: r, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("trades").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("trades").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteTrade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("trades").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
