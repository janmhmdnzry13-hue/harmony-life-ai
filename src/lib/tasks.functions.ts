import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  notes: z.string().max(2000).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  tag: z.string().max(50).optional().nullable(),
  due_date: z.string().optional().nullable(),
  just_for_today: z.boolean().optional().default(false),
});

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Purge expired one-day tasks (expires_on strictly before today)
    await context.supabase.from("tasks").delete().lt("expires_on", todayStr());

    const { data, error } = await context.supabase
      .from("tasks")
      .select("*")
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => upsertSchema.parse(v))
  .handler(async ({ data, context }) => {
    const { just_for_today, ...rest } = data;
    const payload = {
      ...rest,
      user_id: context.userId,
      expires_on: just_for_today ? todayStr() : null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("tasks").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("tasks").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const toggleTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid(), completed: z.boolean() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tasks")
      .update({ completed: data.completed, completed_at: data.completed ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
