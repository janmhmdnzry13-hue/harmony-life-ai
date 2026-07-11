import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export const listHabits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Purge one-day habits from prior days
    await context.supabase.from("habits").delete().lt("expires_on", todayStr());

    const [{ data: habits, error: e1 }, { data: logs, error: e2 }] = await Promise.all([
      context.supabase.from("habits").select("*").eq("archived", false).order("created_at"),
      context.supabase
        .from("habit_logs")
        .select("habit_id, log_date, count")
        .gte("log_date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return { habits: habits ?? [], logs: logs ?? [] };
  });

export const createHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      name: z.string().min(1).max(80),
      description: z.string().max(200).optional().nullable(),
      target_per_day: z.number().int().min(1).max(20).default(1),
      just_for_today: z.boolean().optional().default(false),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { just_for_today, ...rest } = data;
    const { error } = await context.supabase.from("habits").insert({
      ...rest,
      user_id: context.userId,
      expires_on: just_for_today ? todayStr() : null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleHabitLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ habit_id: z.string().uuid(), log_date: z.string() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("habit_logs")
      .select("id")
      .eq("habit_id", data.habit_id)
      .eq("log_date", data.log_date)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase.from("habit_logs").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { logged: false };
    }
    const { error } = await context.supabase.from("habit_logs").insert({
      habit_id: data.habit_id,
      log_date: data.log_date,
      user_id: context.userId,
      count: 1,
    });
    if (error) throw new Error(error.message);
    return { logged: true };
  });

export const deleteHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("habits").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
