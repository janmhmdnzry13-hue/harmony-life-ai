import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

type Body = { messages?: UIMessage[] };

const SYSTEM = `You are Origin — a calm, thoughtful life operating system assistant.
You help the user with daily planning, tasks, habits, mood, and reflection.
Be warm but concise. Speak plainly. Ask one focused question when unsure.
When the user asks for a schedule, propose realistic time blocks.
When they seem overwhelmed, help them pick one small next action.
Use markdown sparingly.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Verify auth via bearer token via server-side supabase
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice(7);
        // Validate token by hitting Supabase
        const supaUrl = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!supaUrl || !key) return new Response("Missing config", { status: 500 });
        const userRes = await fetch(`${supaUrl}/auth/v1/user`, {
          headers: { apikey: key, Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) return new Response("Unauthorized", { status: 401 });

        const { messages } = (await request.json()) as Body;
        if (!Array.isArray(messages)) return new Response("Bad request", { status: 400 });

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(apiKey);
        const model = gateway("google/gemini-3-flash-preview");
        const result = streamText({
          model,
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});

// suppress unused import warnings if any
export type _Auth = typeof requireSupabaseAuth;
