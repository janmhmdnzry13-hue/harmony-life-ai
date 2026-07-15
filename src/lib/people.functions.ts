import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const contactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  relation: z.enum(["family", "friend", "colleague", "other"]).default("other"),
  email: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  birthday: z.string().optional(),
  notes: z.string().max(2000).optional(),
  avatar_url: z.string().max(500).optional(),
});

export const listContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [contacts, gifts, rem] = await Promise.all([
      context.supabase.from("contacts").select("*").order("name"),
      context.supabase.from("gift_ideas").select("*").order("created_at", { ascending: false }),
      context.supabase.from("communication_reminders").select("*"),
    ]);
    if (contacts.error) throw new Error(contacts.error.message);
    return { contacts: contacts.data ?? [], gifts: gifts.data ?? [], reminders: rem.data ?? [] };
  });

export const upsertContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => contactSchema.parse(v))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("contacts").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("contacts")
        .insert({ ...data, user_id: context.userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("contacts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertGift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      contact_id: z.string().uuid().optional(),
      title: z.string().min(1).max(200),
      occasion: z.string().max(80).optional(),
      budget: z.number().optional(),
      url: z.string().max(500).optional(),
      status: z.enum(["idea", "bought", "given"]).default("idea"),
      notes: z.string().max(1000).optional(),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("gift_ideas").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("gift_ideas")
        .insert({ ...data, user_id: context.userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteGift = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("gift_ideas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}

export const upsertReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      contact_id: z.string().uuid(),
      cadence_days: z.number().int().min(1).max(365).default(30),
      last_contacted_on: z.string().optional(),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const last = data.last_contacted_on ?? new Date().toISOString().slice(0, 10);
    const next = addDays(last, data.cadence_days);
    const payload = { ...data, last_contacted_on: last, next_due_on: next };
    if (data.id) {
      const { error } = await context.supabase.from("communication_reminders").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("communication_reminders")
        .insert({ ...payload, user_id: context.userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("communication_reminders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markContacted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: r } = await context.supabase
      .from("communication_reminders")
      .select("cadence_days")
      .eq("id", data.id)
      .maybeSingle();
    const today = new Date().toISOString().slice(0, 10);
    const next = addDays(today, r?.cadence_days ?? 30);
    const { error } = await context.supabase
      .from("communication_reminders")
      .update({ last_contacted_on: today, next_due_on: next })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
