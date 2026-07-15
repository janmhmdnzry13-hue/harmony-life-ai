import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listTrips = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("trips")
      .select("*")
      .order("starts_on", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const [trip, items, packing, journal] = await Promise.all([
      context.supabase.from("trips").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("trip_items").select("*").eq("trip_id", data.id).order("starts_at"),
      context.supabase.from("packing_items").select("*").eq("trip_id", data.id).order("created_at"),
      context.supabase.from("travel_journal").select("*").eq("trip_id", data.id).order("entry_date", { ascending: false }),
    ]);
    if (trip.error) throw new Error(trip.error.message);
    return {
      trip: trip.data,
      items: items.data ?? [],
      packing: packing.data ?? [],
      journal: journal.data ?? [],
    };
  });

export const upsertTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).max(120),
      destination: z.string().max(120).optional(),
      starts_on: z.string().optional(),
      ends_on: z.string().optional(),
      budget: z.number().optional(),
      notes: z.string().max(2000).optional(),
      cover_url: z.string().max(500).optional(),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("trips").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("trips")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created!.id };
  });

export const deleteTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("trips").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      trip_id: z.string().uuid(),
      kind: z.enum(["flight", "hotel", "activity", "transport"]).default("activity"),
      title: z.string().min(1).max(200),
      starts_at: z.string().optional(),
      ends_at: z.string().optional(),
      cost: z.number().optional(),
      notes: z.string().max(1000).optional(),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("trip_items").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("trip_items")
        .insert({ ...data, user_id: context.userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("trip_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addPacking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ trip_id: z.string().uuid(), label: z.string().min(1).max(120) }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("packing_items")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const togglePacking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid(), packed: z.boolean() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("packing_items")
      .update({ packed: data.packed })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePacking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("packing_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addJournal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      trip_id: z.string().uuid(),
      entry_date: z.string(),
      title: z.string().max(200).optional(),
      body: z.string().max(5000).optional(),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("travel_journal")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteJournal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("travel_journal").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
