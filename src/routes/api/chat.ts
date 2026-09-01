import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { buildContextSnapshot, type Db } from "@/lib/intelligence.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { streamText, generateText, convertToModelMessages, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";

type Body = { messages?: UIMessage[] };

const SYSTEM = `You are Origin — the user's personal life operating system intelligence.
You have durable long-term memory and live context about their health, finances, productivity, mood, goals, tasks and calendar.
Behave proactively: if the context shows something important (falling sleep, burnout risk, budget overrun, a goal drifting), mention it briefly even if not asked.
Be warm, precise and concise. Reference concrete numbers from the context instead of generalities.
Ask one focused question when unsure. Use markdown sparingly. No emojis.

You can change the user's real data with tools: create_task, complete_task, create_habit, log_habit.
When the user asks for something actionable ("add a task", "remind me to", "I did my run"), call the tool instead of only replying.
After a tool succeeds, confirm in one short sentence and say where it lives (Plan for tasks, Habits for habits).`;

function textOf(message: UIMessage) {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = authHeader.slice(7);

        const supaUrl = process.env["SUPABASE_URL"];
        const publishable = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!supaUrl || !publishable) return new Response("Missing config", { status: 500 });

        const userRes = await fetch(`${supaUrl}/auth/v1/user`, {
          headers: { apikey: publishable, Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) return new Response("Unauthorized", { status: 401 });
        const user = (await userRes.json()) as { id: string };

        const supabase = createClient<Database>(supaUrl, publishable, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}`, apikey: publishable } },
        }) as Db;

        const { messages } = (await request.json()) as Body;
        if (!Array.isArray(messages)) return new Response("Bad request", { status: 400 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let snapshot: unknown = null;
        try {
          snapshot = await buildContextSnapshot(supabase);
        } catch {
          snapshot = null;
        }


        const today = new Date().toISOString().slice(0, 10);
        const tools = {
          create_task: tool({
            description: "Create a real task in the user's Plan.",
            inputSchema: z.object({
              title: z.string().min(1).max(200),
              priority: z.enum(["low", "medium", "high"]).optional(),
              due_date: z.string().describe("YYYY-MM-DD").optional(),
              tag: z.string().max(40).optional(),
            }),
            execute: async ({ title, priority, due_date, tag }) => {
              const { data, error } = await supabase
                .from("tasks")
                .insert({ user_id: user.id, title, priority: priority ?? "medium", due_date: due_date ?? null, tag: tag ?? null })
                .select("id, title")
                .single();
              if (error) return { ok: false as const, error: error.message };
              return { ok: true as const, task: data, where: "Plan" };
            },
          }),
          complete_task: tool({
            description: "Mark an existing task complete by matching its title.",
            inputSchema: z.object({ title: z.string().min(1) }),
            execute: async ({ title }) => {
              const { data: found, error: findError } = await supabase
                .from("tasks")
                .select("id, title")
                .eq("completed", false)
                .ilike("title", `%${title}%`)
                .limit(1);
              if (findError) return { ok: false as const, error: findError.message };
              const target = found?.[0];
              if (!target) return { ok: false as const, error: "No open task matched that title." };
              const { error } = await supabase
                .from("tasks")
                .update({ completed: true, completed_at: new Date().toISOString() })
                .eq("id", target.id);
              if (error) return { ok: false as const, error: error.message };
              return { ok: true as const, task: target, where: "Plan" };
            },
          }),
          create_habit: tool({
            description: "Create a habit the user wants to track daily.",
            inputSchema: z.object({ name: z.string().min(1).max(120), target_per_day: z.number().int().min(1).max(20).optional() }),
            execute: async ({ name, target_per_day }) => {
              const { data, error } = await supabase
                .from("habits")
                .insert({ user_id: user.id, name, target_per_day: target_per_day ?? 1 })
                .select("id, name")
                .single();
              if (error) return { ok: false as const, error: error.message };
              return { ok: true as const, habit: data, where: "Habits" };
            },
          }),
          log_habit: tool({
            description: "Log today's completion for an existing habit, matched by name.",
            inputSchema: z.object({ name: z.string().min(1), count: z.number().int().min(1).max(20).optional() }),
            execute: async ({ name, count }) => {
              const { data: found, error: findError } = await supabase
                .from("habits")
                .select("id, name")
                .eq("archived", false)
                .ilike("name", `%${name}%`)
                .limit(1);
              if (findError) return { ok: false as const, error: findError.message };
              const habit = found?.[0];
              if (!habit) return { ok: false as const, error: "No habit matched that name." };
              const { error } = await supabase
                .from("habit_logs")
                .insert({ user_id: user.id, habit_id: habit.id, log_date: today, count: count ?? 1 });
              if (error) return { ok: false as const, error: error.message };
              return { ok: true as const, habit, logged_on: today, where: "Habits" };
            },
          }),
        };

        const gateway = createLovableAiGatewayProvider(apiKey);
        const result = streamText({
          model: gateway("openai/gpt-5.6-sol"),
          providerOptions: { lovable: { reasoningEffort: "none" } },
          system: snapshot ? `${SYSTEM}\n\nLIVE CONTEXT + MEMORY (JSON):\n${JSON.stringify(snapshot)}` : SYSTEM,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(6),
        });

        const lastUser = [...messages].reverse().find((m) => m.role === "user");

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            const assistantText = textOf(responseMessage as UIMessage);
            const userText = lastUser ? textOf(lastUser) : "";

            const rows = [
              userText ? { user_id: user.id, role: "user", content: userText } : null,
              assistantText ? { user_id: user.id, role: "assistant", content: assistantText } : null,
            ].filter((r): r is { user_id: string; role: string; content: string } => r !== null);
            if (rows.length) {
              const { error } = await supabase.from("ai_messages").insert(rows);
              if (error) console.error("chat persist failed", error.message);
            }

            // Long-term memory extraction — only durable facts, never chit-chat.
            if (!userText) return;
            try {
              const { text } = await generateText({
                model: gateway("openai/gpt-5.6-luna"),
                providerOptions: { lovable: { reasoningEffort: "none" } },
                system: `Extract durable long-term memories about the user from this exchange.
Return STRICT JSON only: {"memories":[{"kind":"fact|preference|goal|person|routine","content":"one short sentence","importance":1-5}]}
Only include things worth remembering for months (preferences, constraints, relationships, recurring routines, stated goals). If nothing qualifies return {"memories":[]}.`,
                prompt: `USER: ${userText}\nASSISTANT: ${assistantText}`,
              });
              const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
              const parsed = JSON.parse(cleaned) as {
                memories?: Array<{ kind?: string; content?: string; importance?: number }>;
              };
              const memories = (parsed.memories ?? [])
                .filter((m) => m.content && m.content.length > 3)
                .slice(0, 4)
                .map((m) => ({
                  user_id: user.id,
                  kind: ["fact", "preference", "goal", "person", "routine"].includes(m.kind ?? "") ? m.kind! : "fact",
                  content: String(m.content).slice(0, 300),
                  importance: Math.max(1, Math.min(5, Math.round(Number(m.importance ?? 3)))),
                  source: "chat",
                }));
              if (memories.length) {
                const { error } = await supabase.from("ai_memories").insert(memories);
                if (error) console.error("memory insert failed", error.message);
              }
            } catch (e) {
              console.error("memory extraction skipped", e);
            }
          },
        });
      },
    },
  },
});
