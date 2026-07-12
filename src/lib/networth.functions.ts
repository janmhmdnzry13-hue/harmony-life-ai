import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  type: z.enum(ACCOUNT_TYPES).default("cash"),
  balance: z.number().max(1_000_000_000_000),
  currency: z.string().min(1).max(6).default("USD"),
  notes: z.string().max(500).optional().nullable(),
});

export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [acc, hold] = await Promise.all([
      context.supabase.from("accounts").select("*").order("created_at", { ascending: false }),
      context.supabase.from("holdings").select("id,asset_type,quantity,current_price,avg_cost,currency,account_id,symbol,name"),
    ]);
    if (acc.error) throw new Error(acc.error.message);
    if (hold.error) throw new Error(hold.error.message);
    return { accounts: acc.data ?? [], holdings: hold.data ?? [] };
  });

export const upsertAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => schema.parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("accounts").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("accounts").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("accounts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
