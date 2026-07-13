import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { z } from "zod";

const scopeSchema = z.object({
  scope: z.enum(["daily", "motivation", "habits", "burnout"]).default("daily"),
});

export const runWellnessCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => scopeSchema.parse(v))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    const sinceDate = since.slice(0, 10);

    const [sleep, workouts, mood, stress, habits, hlogs, steps, water] = await Promise.all([
      context.supabase.from("sleep_logs").select("duration_min,quality,log_date").gte("log_date", sinceDate),
      context.supabase.from("workouts").select("type,duration_min,log_date").gte("log_date", sinceDate),
      context.supabase.from("mood_logs").select("mood,energy,logged_at").gte("logged_at", since),
      context.supabase.from("stress_logs").select("level,logged_at").gte("logged_at", since),
      context.supabase.from("habits").select("id,name").eq("archived", false),
      context.supabase.from("habit_logs").select("habit_id,log_date").gte("log_date", sinceDate),
      context.supabase.from("step_logs").select("steps,log_date").gte("log_date", sinceDate),
      context.supabase.from("water_logs").select("amount_ml,log_date").gte("log_date", sinceDate),
    ]);

    const avg = (arr: number[]) => arr.length ? Number((arr.reduce((s, n) => s + n, 0) / arr.length).toFixed(1)) : null;
    const avgSleep = avg((sleep.data ?? []).map((r) => Number(r.duration_min ?? 0) / 60));
    const avgMood = avg((mood.data ?? []).map((r) => r.mood));
    const avgStress = avg((stress.data ?? []).map((r) => r.level));
    const avgSteps = avg((steps.data ?? []).map((r) => r.steps));

    const habitCount = habits.data?.length ?? 0;
    const doneRate = habitCount && (hlogs.data ?? []).length ? Math.round(((hlogs.data ?? []).length / (habitCount * 14)) * 100) : 0;

    const burnoutScore =
      (avgSleep !== null && avgSleep < 6 ? 1 : 0) +
      (avgStress !== null && avgStress >= 7 ? 1 : 0) +
      (avgMood !== null && avgMood <= 2 ? 1 : 0) +
      (doneRate < 30 ? 1 : 0);

    const summary = {
      window: "14d",
      avgSleepHours: avgSleep, avgMood, avgStress, avgSteps,
      workouts: workouts.data?.length ?? 0,
      waterMlAvg: avg((water.data ?? []).map((r) => r.amount_ml)),
      habitCount, habitConsistencyPct: doneRate,
      burnoutScore, burnoutRisk: burnoutScore >= 3 ? "high" : burnoutScore >= 1 ? "moderate" : "low",
    };

    const systems: Record<typeof data.scope, string> = {
      daily: "Give one personalized paragraph of daily advice referencing the numbers. 3-4 sentences. End with one concrete action.",
      motivation: "Give a short, grounded motivational reflection. Not saccharine. 2-3 sentences.",
      habits: "Suggest 1-2 concrete habit adjustments based on consistency and mood. 2-3 sentences.",
      burnout: "Read the burnout signals honestly. State the risk level and one recovery step. 2-3 sentences.",
    };

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: "You are Origin, a calm, precise wellness coach. Editorial tone. No bullets, no emojis. Reference concrete numbers. " + systems[data.scope],
      prompt: JSON.stringify(summary),
    });

    return { insight: text.trim(), summary };
  });
