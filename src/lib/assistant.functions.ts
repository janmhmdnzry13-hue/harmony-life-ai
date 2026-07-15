import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { z } from "zod";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const reviewSchema = z.object({ kind: z.enum(["weekly", "monthly"]).default("weekly") });

export const listReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reviews")
      .select("*")
      .order("period_end", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const runReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => reviewSchema.parse(v))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const days = data.kind === "weekly" ? 7 : 30;
    const start = daysAgo(days);
    const end = new Date().toISOString().slice(0, 10);

    const [tasks, logs, mood, events, tx] = await Promise.all([
      context.supabase.from("tasks").select("title,completed,priority,created_at").gte("created_at", start),
      context.supabase.from("habit_logs").select("habit_id,log_date,count").gte("log_date", start),
      context.supabase.from("mood_logs").select("mood,energy,logged_at").gte("logged_at", start),
      context.supabase.from("events").select("title,starts_at").gte("starts_at", start),
      context.supabase.from("transactions").select("type,amount,category,occurred_on").gte("occurred_on", start),
    ]);

    const tasksArr = tasks.data ?? [];
    const done = tasksArr.filter((t) => t.completed).length;
    const income = (tx.data ?? []).filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = (tx.data ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const avgMood =
      (mood.data ?? []).length > 0
        ? Number(((mood.data ?? []).reduce((s, m) => s + Number(m.mood), 0) / (mood.data ?? []).length).toFixed(2))
        : null;

    const summary = {
      period: { start, end, days },
      tasks: { total: tasksArr.length, completed: done, completion_rate: tasksArr.length ? done / tasksArr.length : 0 },
      habit_check_ins: (logs.data ?? []).length,
      mood_avg: avgMood,
      event_count: (events.data ?? []).length,
      cashflow: { income, expense, net: income - expense },
    };

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system:
        "You are Origin, a calm productivity coach. Write a short editorial review in markdown with three sections: **Wins**, **Friction**, **Next focus**. 2 lines per section. No emojis.",
      prompt: `${data.kind.toUpperCase()} data:\n${JSON.stringify(summary)}`,
    });

    const { error } = await context.supabase.from("reviews").insert({
      user_id: context.userId,
      kind: data.kind,
      period_start: start,
      period_end: end,
      body_md: text,
    });
    if (error) throw new Error(error.message);
    return { body_md: text, summary };
  });

export const runSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const [tasks, events] = await Promise.all([
      context.supabase.from("tasks").select("title,priority,due_date").eq("completed", false).limit(20),
      context.supabase.from("events").select("title,starts_at").gte("starts_at", new Date().toISOString()).limit(20),
    ]);
    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system:
        "You are Origin. Given the user's unfinished tasks and upcoming events, propose exactly 3 concrete next actions. Numbered list, one line each, no preamble.",
      prompt: JSON.stringify({ tasks: tasks.data ?? [], events: events.data ?? [] }),
    });
    return { suggestions: text.trim() };
  });
