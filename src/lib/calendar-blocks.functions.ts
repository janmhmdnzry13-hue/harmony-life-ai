import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  title: z.string().min(1).max(200),
  category: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const listTimeBlocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("time_blocks")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertTimeBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => upsertSchema.parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("time_blocks").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("time_blocks").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteTimeBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("time_blocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const meetingSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  starts_at: z.string(),
  ends_at: z.string().optional().nullable(),
  attendees: z.array(z.string()).optional(),
  location: z.string().max(200).optional().nullable(),
  agenda: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const listMeetings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("meetings")
      .select("*")
      .order("starts_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => meetingSchema.parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("meetings").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("meetings").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("meetings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
