import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { z } from "zod";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  category: z.enum(["passport", "id", "contract", "receipt", "other"]).default("other"),
  file_path: z.string().max(500).optional(),
  mime: z.string().max(100).optional(),
  size: z.number().int().optional(),
  expires_on: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => upsertSchema.parse(v))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("documents").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("documents")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created!.id };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const doc = await context.supabase.from("documents").select("file_path").eq("id", data.id).maybeSingle();
    if (doc.data?.file_path) {
      await context.supabase.storage.from("documents").remove([doc.data.file_path]);
    }
    const { error } = await context.supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const signedUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ filename: z.string().min(1).max(200) }).parse(v))
  .handler(async ({ data, context }) => {
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${context.userId}/${Date.now()}-${safe}`;
    const { data: signed, error } = await context.supabase.storage
      .from("documents")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });

export const signedReadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ path: z.string() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("documents")
      .createSignedUrl(data.path, 3600);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const runOcr = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { data: doc, error } = await context.supabase
      .from("documents")
      .select("file_path,mime,title")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc?.file_path) throw new Error("No file to scan");
    const { data: signed } = await context.supabase.storage.from("documents").createSignedUrl(doc.file_path, 600);
    if (!signed?.signedUrl) throw new Error("Could not read file");
    const gateway = createLovableAiGatewayProvider(key);
    const isImage = (doc.mime ?? "").startsWith("image/");
    const { text } = await generateText({
      model: gateway("google/gemini-2.5-flash"),
      system: "Extract all readable text from the attached document. Return plain text only.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Extract text from: ${doc.title}` },
            isImage
              ? { type: "image", image: signed.signedUrl }
              : { type: "file", data: signed.signedUrl, mediaType: doc.mime ?? "application/pdf" },
          ],
        },
      ],
    });
    await context.supabase.from("documents").update({ ocr_text: text }).eq("id", data.id);
    return { ocr_text: text };
  });
