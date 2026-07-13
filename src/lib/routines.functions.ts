import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const todayStr = () => new Date().toISOString().slice(0, 10);
const uuid = z.string().uuid();

export const listRoutines = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = todayStr();
    const [{ data: routines, error: e1 }, { data: logs, error: e2 }] = await Promise.all([
      context.supabase.from("routines").select("*").eq("active", true).order("kind"),
      context.supabase.from("routine_logs").select("*").eq("log_date", today),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return { routines: routines ?? [], logs: logs ?? [] };
  });

export const createRoutine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    name: z.string().min(1).max(80),
    kind: z.enum(["morning", "night"]),
    steps: z.array(z.string().min(1).max(120)).min(1).max(20),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("routines").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRoutine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("routines").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleRoutineStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    routine_id: uuid,
    step_index: z.number().int().min(0).max(50),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const today = todayStr();
    const { data: existing } = await context.supabase.from("routine_logs")
      .select("id,completed_steps").eq("routine_id", data.routine_id).eq("log_date", today).maybeSingle();
    if (!existing) {
      const { error } = await context.supabase.from("routine_logs").insert({
        routine_id: data.routine_id, log_date: today, user_id: context.userId,
        completed_steps: [data.step_index],
      });
      if (error) throw new Error(error.message);
    } else {
      const cur = existing.completed_steps ?? [];
      const next = cur.includes(data.step_index) ? cur.filter((n: number) => n !== data.step_index) : [...cur, data.step_index];
      const { error } = await context.supabase.from("routine_logs").update({ completed_steps: next }).eq("id", existing.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
