import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  target_amount: z.number().nonnegative().max(1_000_000_000),
  current_amount: z.number().nonnegative().max(1_000_000_000).default(0),
  currency: z.string().min(1).max(6).default("USD"),
  deadline: z.string().optional().nullable(),
  category: z.string().max(40).default("general"),
});

export const listGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("savings_goals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => schema.parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("savings_goals").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("savings_goals").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const contributeGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid(), amount: z.number() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: g, error: e1 } = await context.supabase
      .from("savings_goals")
      .select("current_amount")
      .eq("id", data.id)
      .single();
    if (e1) throw new Error(e1.message);
    const next = Number(g.current_amount) + data.amount;
    const { error } = await context.supabase
      .from("savings_goals")
      .update({ current_amount: next })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("savings_goals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
