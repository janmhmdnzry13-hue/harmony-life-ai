import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const todayStr = () => new Date().toISOString().slice(0, 10);
const uuid = z.string().uuid();

/* ============ SLEEP ============ */
export const listSleep = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sleep_logs").select("*").order("log_date", { ascending: false }).limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addSleep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    log_date: z.string().default(todayStr()),
    duration_min: z.number().int().min(0).max(1440),
    quality: z.number().int().min(1).max(5).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sleep_logs")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSleep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sleep_logs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ WORKOUTS ============ */
export const listWorkouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("workouts").select("*").order("log_date", { ascending: false }).limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    log_date: z.string().default(todayStr()),
    type: z.string().min(1).max(60),
    duration_min: z.number().int().min(0).max(600).optional().nullable(),
    intensity: z.enum(["low", "medium", "high"]).optional().nullable(),
    calories: z.number().int().min(0).max(5000).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("workouts").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("workouts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ NUTRITION ============ */
export const listNutrition = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const { data, error } = await context.supabase
      .from("nutrition_logs").select("*").gte("log_date", since).order("log_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addNutrition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    log_date: z.string().default(todayStr()),
    meal: z.enum(["breakfast", "lunch", "dinner", "snack"]),
    name: z.string().min(1).max(120),
    calories: z.number().int().min(0).max(5000).default(0),
    protein: z.number().min(0).default(0),
    carbs: z.number().min(0).default(0),
    fat: z.number().min(0).default(0),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("nutrition_logs").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNutrition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("nutrition_logs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ WATER ============ */
export const listWater = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
    const { data, error } = await context.supabase
      .from("water_logs").select("*").gte("log_date", since).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addWater = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    log_date: z.string().default(todayStr()),
    amount_ml: z.number().int().min(1).max(5000),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("water_logs").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ WEIGHT ============ */
export const listWeight = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("weight_logs").select("*").order("log_date", { ascending: false }).limit(90);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addWeight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    log_date: z.string().default(todayStr()),
    weight_kg: z.number().min(1).max(500),
    body_fat_pct: z.number().min(0).max(100).optional().nullable(),
    notes: z.string().max(300).optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("weight_logs").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWeight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("weight_logs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ STEPS ============ */
export const listSteps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const { data, error } = await context.supabase
      .from("step_logs").select("*").gte("log_date", since).order("log_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setSteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    log_date: z.string().default(todayStr()),
    steps: z.number().int().min(0).max(100000),
    distance_km: z.number().min(0).max(200).optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("step_logs")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id,log_date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
