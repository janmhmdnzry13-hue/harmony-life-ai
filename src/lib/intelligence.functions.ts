import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { computeScores, buildContextSnapshot } from "@/lib/intelligence.server";
import { z } from "zod";

/** Recompute all life scores and persist today's snapshot. */
export const refreshScores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = await computeScores(context.supabase);
    const { error } = await context.supabase.from("life_scores").upsert(
      {
        user_id: context.userId,
        score_date: new Date().toISOString().slice(0, 10),
        life_score: s.life,
        health_score: s.health,
        finance_score: s.finance,
        productivity_score: s.productivity,
        happiness_score: s.happiness,
        burnout_risk: s.burnout,
        breakdown: s.breakdown,
      },
      { onConflict: "user_id,score_date" },
    );
    if (error) throw new Error(error.message);
    return s;
  });

export const getScoreHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("life_scores")
      .select("*")
      .order("score_date", { ascending: true })
      .limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_insights")
      .select("*")
      .eq("dismissed", false)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const dismissInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_insights").update({ dismissed: true }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Predictive analytics: generates recommendations, predictions and early warnings. */
export const runIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const snapshot = await buildContextSnapshot(context.supabase);
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      providerOptions: { lovable: { reasoningEffort: "none" } },
      system: `You are Origin, a proactive life-operating-system intelligence.
Analyse the user's snapshot and return STRICT JSON only, no markdown fences:
{"items":[{"kind":"recommendation|prediction|warning","domain":"health|finance|productivity|happiness|goals|life","title":"<=52 chars","body":"1-2 sentences citing a concrete number","severity":"info|warn|critical","confidence":0-100}]}
Return 4 to 6 items. Include at least one prediction (what happens if the current trend continues) and, when signals justify it, one warning that detects a problem before it happens. Never invent data that is not in the snapshot.`,
      prompt: JSON.stringify(snapshot),
    });

    let items: Array<{
      kind?: string; domain?: string; title?: string; body?: string; severity?: string; confidence?: number;
    }> = [];
    try {
      const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
      const parsed = JSON.parse(cleaned) as { items?: typeof items };
      items = parsed.items ?? [];
    } catch {
      items = [];
    }

    const rows = items
      .filter((i) => i.title && i.body)
      .slice(0, 6)
      .map((i) => ({
        user_id: context.userId,
        kind: ["recommendation", "prediction", "warning"].includes(i.kind ?? "") ? i.kind! : "recommendation",
        domain: i.domain ?? "life",
        title: String(i.title).slice(0, 90),
        body: String(i.body).slice(0, 600),
        severity: ["info", "warn", "critical"].includes(i.severity ?? "") ? i.severity! : "info",
        confidence: Math.max(0, Math.min(100, Math.round(Number(i.confidence ?? 60)))),
      }));

    if (rows.length === 0) throw new Error("Origin could not read enough data yet. Log a few days first.");

    await context.supabase.from("ai_insights").update({ dismissed: true }).eq("dismissed", false);
    const { error } = await context.supabase.from("ai_insights").insert(rows);
    if (error) throw new Error(error.message);
    return { count: rows.length, snapshot };
  });

/** AI planning: generates a realistic time-blocked plan for today or tomorrow. */
export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ day: z.enum(["today", "tomorrow"]).default("today") }).parse(v))
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const snapshot = await buildContextSnapshot(context.supabase);
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      providerOptions: { lovable: { reasoningEffort: "none" } },
      system: `You are Origin. Produce a realistic time-blocked plan for ${data.day}.
Markdown only: a list of "HH:MM–HH:MM — block" lines (6 to 9 lines), then a single line starting with "Why: " explaining the shape of the day.
Respect the user's energy, burnout risk, existing events and open tasks. No emojis, no preamble.`,
      prompt: JSON.stringify(snapshot),
    });
    return { plan: text.trim(), day: data.day };
  });

/** Weekly / monthly narrative report grounded in the score history. */
export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ kind: z.enum(["weekly", "monthly"]).default("weekly") }).parse(v))
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const days = data.kind === "weekly" ? 7 : 30;
    const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const end = new Date().toISOString().slice(0, 10);

    const [snapshot, history] = await Promise.all([
      buildContextSnapshot(context.supabase),
      context.supabase.from("life_scores").select("*").gte("score_date", start).order("score_date"),
    ]);

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      providerOptions: { lovable: { reasoningEffort: "none" } },
      system: `You are Origin. Write a ${data.kind} life report in markdown with sections **Signal**, **Wins**, **Drift**, **Next week**.
Two lines per section, grounded in the numbers. No emojis.`,
      prompt: JSON.stringify({ snapshot, history: history.data ?? [] }),
    });

    const { error } = await context.supabase.from("reviews").insert({
      user_id: context.userId,
      kind: data.kind,
      period_start: start,
      period_end: end,
      body_md: text.trim(),
    });
    if (error) throw new Error(error.message);
    return { body_md: text.trim(), kind: data.kind };
  });

/* ---------------------------------- memory --------------------------------- */

export const listMemories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_memories")
      .select("*")
      .order("importance", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        content: z.string().min(2),
        kind: z.enum(["fact", "preference", "goal", "person", "routine"]).default("fact"),
        importance: z.number().int().min(1).max(5).default(3),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_memories")
      .insert({ ...data, user_id: context.userId, source: "manual" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ai_memories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------- automations ------------------------------- */

export const listAutomations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_automations")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        agent_key: z.string().min(2),
        name: z.string().min(2),
        description: z.string().optional(),
        schedule: z.enum(["hourly", "daily", "weekly", "monthly"]).default("daily"),
        active: z.boolean().default(true),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_automations")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id,agent_key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Runs one agent now: analyses its domain and writes fresh insights. */
export const runAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        agent_key: z.enum(["planner", "health", "finance", "productivity", "burnout", "goals"]),
      })
      .parse(v),
  )
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const snapshot = await buildContextSnapshot(context.supabase);
    const briefs: Record<typeof data.agent_key, string> = {
      planner: "You are the Planner agent. Propose the single most valuable rearrangement of the user's day.",
      health: "You are the Health agent. Read sleep, movement, hydration and weight signals.",
      finance: "You are the Finance agent. Read cash flow, budget adherence and net worth.",
      productivity: "You are the Productivity agent. Read task completion, habit consistency and time blocking.",
      burnout: "You are the Burnout agent. Predict burnout risk honestly and name the earliest intervention.",
      goals: "You are the Goals agent. Predict which goals will be missed at the current pace.",
    };
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      providerOptions: { lovable: { reasoningEffort: "none" } },
      system: `${briefs[data.agent_key]} Reply with 2-3 sentences citing concrete numbers. Editorial tone, no bullets, no emojis.`,
      prompt: JSON.stringify(snapshot),
    });
    const result = text.trim();

    await context.supabase.from("ai_insights").insert({
      user_id: context.userId,
      kind: data.agent_key === "burnout" || data.agent_key === "goals" ? "prediction" : "recommendation",
      domain: data.agent_key === "planner" ? "productivity" : data.agent_key,
      title: `${data.agent_key[0]!.toUpperCase()}${data.agent_key.slice(1)} agent`,
      body: result,
      severity: data.agent_key === "burnout" && snapshot.scores.burnout >= 60 ? "critical" : "info",
      confidence: 70,
    });
    await context.supabase
      .from("ai_automations")
      .update({ last_run_at: new Date().toISOString(), last_result: result })
      .eq("agent_key", data.agent_key);

    return { result };
  });
