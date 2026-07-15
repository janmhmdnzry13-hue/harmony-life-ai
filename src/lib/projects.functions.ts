import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(120),
      description: z.string().max(1000).optional().nullable(),
      status: z.string().max(40).optional().nullable(),
      color: z.string().max(20).optional().nullable(),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("projects").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("projects")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    // seed columns
    const cols = ["Backlog", "In Progress", "Done"].map((name, i) => ({
      user_id: context.userId,
      project_id: created!.id,
      name,
      position: i,
    }));
    await context.supabase.from("project_columns").insert(cols);
    return { id: created!.id };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getBoard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ project_id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const [proj, cols, cards, deps] = await Promise.all([
      context.supabase.from("projects").select("*").eq("id", data.project_id).maybeSingle(),
      context.supabase.from("project_columns").select("*").eq("project_id", data.project_id).order("position"),
      context.supabase.from("project_cards").select("*").eq("project_id", data.project_id).order("position"),
      context.supabase.from("project_deps").select("*"),
    ]);
    if (proj.error) throw new Error(proj.error.message);
    return {
      project: proj.data,
      columns: cols.data ?? [],
      cards: cards.data ?? [],
      deps: deps.data ?? [],
    };
  });

export const upsertColumn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      project_id: z.string().uuid(),
      name: z.string().min(1).max(60),
      position: z.number().int().default(0),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("project_columns").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("project_columns")
        .insert({ ...data, user_id: context.userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteColumn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("project_columns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      project_id: z.string().uuid(),
      column_id: z.string().uuid().nullable().optional(),
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional().nullable(),
      position: z.number().int().default(0),
      due_date: z.string().nullable().optional(),
    }).parse(v),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { error } = await context.supabase.from("project_cards").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("project_cards")
        .insert({ ...data, user_id: context.userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const moveCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), column_id: z.string().uuid(), position: z.number().int() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("project_cards")
      .update({ column_id: data.column_id, position: data.position })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("project_cards").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addDep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ card_id: z.string().uuid(), depends_on_card_id: z.string().uuid() }).parse(v),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("project_deps")
      .insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeDep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("project_deps").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
