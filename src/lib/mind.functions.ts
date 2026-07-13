import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { z } from "zod";

const todayStr = () => new Date().toISOString().slice(0, 10);
const uuid = z.string().uuid();

/* ============ MOOD ============ */
export const listMood = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mood_logs").select("*").order("logged_at", { ascending: false }).limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addMood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    mood: z.number().int().min(1).max(5),
    energy: z.number().int().min(1).max(5).optional().nullable(),
    tags: z.array(z.string().max(30)).max(10).default([]),
    notes: z.string().max(500).optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mood_logs").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mood_logs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ GRATITUDE ============ */
export const listGratitude = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("gratitude_entries").select("*").order("log_date", { ascending: false }).limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveGratitude = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    log_date: z.string().default(todayStr()),
    entries: z.array(z.string().max(200)).min(1).max(5),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("gratitude_entries")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id,log_date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ REFLECTION ============ */
export const listReflections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reflection_entries").select("*").order("log_date", { ascending: false }).limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    log_date: z.string().default(todayStr()),
    prompt: z.string().max(200).optional().nullable(),
    body: z.string().min(1).max(4000),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reflection_entries")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reflection_entries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ STRESS ============ */
export const listStress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("stress_logs").select("*").order("logged_at", { ascending: false }).limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addStress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    level: z.number().int().min(1).max(10),
    triggers: z.array(z.string().max(30)).max(10).default([]),
    notes: z.string().max(500).optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stress_logs").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ AI EMOTION ANALYSIS ============ */
export const analyzeEmotions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    const [{ data: moods }, { data: refls }, { data: stress }] = await Promise.all([
      context.supabase.from("mood_logs").select("mood,energy,tags,notes,logged_at").gte("logged_at", since),
      context.supabase.from("reflection_entries").select("body,log_date").gte("log_date", since.slice(0, 10)),
      context.supabase.from("stress_logs").select("level,triggers,logged_at").gte("logged_at", since),
    ]);
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: "You are a calm, precise emotional-wellbeing coach. Editorial tone. 3-4 sentences. Reference concrete patterns. No bullets, no emojis. End with one gentle suggestion.",
      prompt: JSON.stringify({ moods, refls, stress }),
    });
    const avgMood = (moods ?? []).length ? Number(((moods ?? []).reduce((s, m) => s + m.mood, 0) / (moods ?? []).length).toFixed(1)) : null;
    const avgStress = (stress ?? []).length ? Number(((stress ?? []).reduce((s, m) => s + m.level, 0) / (stress ?? []).length).toFixed(1)) : null;
    return { insight: text.trim(), avgMood, avgStress, moodCount: moods?.length ?? 0, stressCount: stress?.length ?? 0 };
  });
