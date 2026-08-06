import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildUnderstanding } from "@/lib/understand.server";
import { z } from "zod";

const VOICE = `You are Origin — a quiet, trusted life advisor inside the user's own life system.
Speak plainly and warmly, like a person who knows them well. Never robotic, never alarming, never preachy.
Be concise. Explain the problem in human terms, ground every claim in the numbers you were given, and recommend exactly one practical action at a time.
Never invent data. No emojis, no bullet symbols unless asked, no preamble.`;

/** The full deterministic understanding of the user's life. */
export const getUnderstanding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => buildUnderstanding(context.supabase));

/** Origin explains, in its own words, why the user is actually stuck. */
export const explainFriction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const u = await buildUnderstanding(context.supabase);
    if (u.friction.length === 0)
      return { text: "Nothing is really in your way right now. That's worth noticing — keep the week as it is." };

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      providerOptions: { lovable: { reasoningEffort: "none" } },
      system: `${VOICE}
Write 3 short paragraphs, no headings:
1. What is actually holding them back right now, in one honest sentence.
2. Why it is happening — the chain between two areas of their life, citing real numbers.
3. The single next action, small enough to do today.`,
      prompt: JSON.stringify({ friction: u.friction, facts: u.facts, scores: u.scores }),
    });
    return { text: text.trim() };
  });

/** Weekly Life Audit — what improved, what slipped, hidden patterns, one opportunity. */
export const runLifeAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const start = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const end = new Date().toISOString().slice(0, 10);
    const [u, history] = await Promise.all([
      buildUnderstanding(context.supabase),
      context.supabase.from("life_scores").select("*").gte("score_date", start).order("score_date"),
    ]);

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      providerOptions: { lovable: { reasoningEffort: "none" } },
      system: `${VOICE}
Write a weekly life audit in markdown with exactly these sections, each two sentences at most:
**What improved**, **What slipped**, **A pattern you might not see**, **The opportunity**, **This week's one action**.
Ground every sentence in the numbers provided. Keep the whole thing under 200 words.`,
      prompt: JSON.stringify({ facts: u.facts, scores: u.scores, patterns: u.patterns, friction: u.friction, graph: u.graph, history: history.data ?? [] }),
    });

    const body = text.trim();
    const { error } = await context.supabase.from("reviews").insert({
      user_id: context.userId,
      kind: "weekly",
      period_start: start,
      period_end: end,
      body_md: body,
    });
    if (error) throw new Error(error.message);
    return { body_md: body, period_start: start, period_end: end };
  });

export const listAudits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* --------------------------- thought → action ---------------------------- */

const actionSchema = z.object({
  title: z.string(),
  note: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().nullable().optional(),
});

export type ThoughtAction = z.infer<typeof actionSchema>;

/** Turns a raw thought, voice note or journal fragment into concrete next steps. */
export const thoughtToAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ text: z.string().min(3).max(6000) }).parse(v))
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    await context.supabase.from("brain_dumps").insert({ user_id: context.userId, content: data.text, processed: true });

    const gateway = createLovableAiGatewayProvider(key);
    const today = new Date().toISOString().slice(0, 10);
    const { text } = await generateText({
      model: gateway("openai/gpt-5.6-sol"),
      providerOptions: { lovable: { reasoningEffort: "none" } },
      system: `${VOICE}
The user just dumped a thought. Turn it into the smallest set of real next actions.
Return STRICT JSON only, no markdown fences:
{"summary":"one warm sentence reflecting what they said","actions":[{"title":"a physical next step, <=70 chars, starts with a verb","note":"optional one-line context or null","priority":"low|medium|high","due_date":"YYYY-MM-DD or null"}]}
Give 1 to 4 actions — fewer is better. Today is ${today}. Only set a due date when the user implied timing.`,
      prompt: data.text,
    });

    let summary = "";
    let actions: ThoughtAction[] = [];
    try {
      const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
      const parsed = JSON.parse(cleaned) as { summary?: string; actions?: unknown[] };
      summary = String(parsed.summary ?? "").slice(0, 220);
      actions = (parsed.actions ?? [])
        .map((a) => actionSchema.safeParse(a))
        .flatMap((r) => (r.success ? [r.data] : []))
        .slice(0, 4);
    } catch {
      actions = [];
    }

    if (actions.length === 0) {
      return {
        summary: summary || "Saved. I couldn't find a clear next step in that yet — try saying what you'd like to be true.",
        actions: [] as ThoughtAction[],
      };
    }
    return { summary, actions };
  });

/** Commits chosen actions from a thought into real tasks. */
export const commitActions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ actions: z.array(actionSchema).min(1).max(4) }).parse(v))
  .handler(async ({ data, context }) => {
    const rows = data.actions.map((a) => ({
      user_id: context.userId,
      title: a.title.slice(0, 300),
      notes: a.note?.slice(0, 500) ?? null,
      priority: a.priority,
      due_date: a.due_date ?? null,
      tag: "origin",
    }));
    const { error } = await context.supabase.from("tasks").insert(rows);
    if (error) throw new Error(error.message);
    return { count: rows.length };
  });
