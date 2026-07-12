import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  amount: z.number().nonnegative().max(1_000_000_000),
  currency: z.string().min(1).max(6).default("USD"),
  cycle: z.enum(["weekly", "monthly", "quarterly", "yearly"]).default("monthly"),
  category: z.enum(["bill", "subscription"]).default("bill"),
  next_due: z.string(),
  is_active: z.boolean().default(true),
  notes: z.string().max(500).optional().nullable(),
});

export const listBills = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bills")
      .select("*")
      .order("next_due", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => schema.parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("bills").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("bills").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("bills").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
