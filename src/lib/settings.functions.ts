import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;
    // seed defaults
    const { data: created, error: insErr } = await context.supabase
      .from("user_settings")
      .insert({ user_id: context.userId })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);
    return created;
  });

const NotificationPrefs = z.object({
  daily_summary: z.boolean().optional(),
  habit_streaks: z.boolean().optional(),
  task_due: z.boolean().optional(),
});

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      theme: z.enum(["light", "dark", "system"]).optional(),
      timezone: z.string().max(80).optional(),
      notification_prefs: NotificationPrefs.optional(),
      daily_summary_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_settings")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
