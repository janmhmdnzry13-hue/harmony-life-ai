import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const todayStr = () => new Date().toISOString().slice(0, 10);
const uuid = z.string().uuid();

/* ============ COURSES ============ */
export const listCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    id: uuid.optional(),
    title: z.string().min(1).max(200),
    provider: z.string().max(80).optional().nullable(),
    url: z.string().url().optional().nullable().or(z.literal("")),
    status: z.enum(["planned", "active", "done"]).default("planned"),
    progress_pct: z.number().int().min(0).max(100).default(0),
    notes: z.string().max(1000).optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, url: data.url || null, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("courses").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("courses").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ BOOKS & READING ============ */
export const listBooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: books, error: e1 }, { data: sessions, error: e2 }] = await Promise.all([
      context.supabase.from("books").select("*").order("created_at", { ascending: false }),
      context.supabase.from("reading_sessions").select("*").gte("log_date", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    return { books: books ?? [], sessions: sessions ?? [] };
  });

export const upsertBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    id: uuid.optional(),
    title: z.string().min(1).max(200),
    author: z.string().max(120).optional().nullable(),
    status: z.enum(["planned", "reading", "done"]).default("planned"),
    pages: z.number().int().min(0).max(10000).optional().nullable(),
    current_page: z.number().int().min(0).max(10000).default(0),
    rating: z.number().int().min(1).max(5).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("books").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("books").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("books").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    book_id: uuid.optional().nullable(),
    log_date: z.string().default(todayStr()),
    minutes: z.number().int().min(0).max(1440).default(0),
    pages: z.number().int().min(0).max(2000).default(0),
    notes: z.string().max(500).optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("reading_sessions").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ FLASHCARDS ============ */
export const listDecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("flashcard_decks").select("*").order("created_at");
    if (error) throw new Error(error.message);
    const decks = data ?? [];
    const withCounts = await Promise.all(decks.map(async (d) => {
      const [{ count: total }, { count: due }] = await Promise.all([
        context.supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("deck_id", d.id),
        context.supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("deck_id", d.id).lte("due_on", todayStr()),
      ]);
      return { ...d, total: total ?? 0, due: due ?? 0 };
    }));
    return withCounts;
  });

export const createDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ name: z.string().min(1).max(80), description: z.string().max(300).optional().nullable() }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("flashcard_decks").insert({ ...data, user_id: context.userId }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteDeck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("flashcard_decks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ deck_id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.from("flashcards").select("*").eq("deck_id", data.deck_id).order("due_on");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    deck_id: uuid,
    front: z.string().min(1).max(500),
    back: z.string().min(1).max(2000),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("flashcards").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reviewCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    id: uuid,
    rating: z.enum(["again", "hard", "good", "easy"]),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const { data: card, error: e1 } = await context.supabase.from("flashcards").select("ease,reps,interval_days").eq("id", data.id).single();
    if (e1) throw new Error(e1.message);
    // SM-2 lite
    let { ease, reps, interval_days } = card as { ease: number; reps: number; interval_days: number };
    const q = { again: 0, hard: 3, good: 4, easy: 5 }[data.rating];
    if (q < 3) { reps = 0; interval_days = 1; }
    else {
      reps += 1;
      if (reps === 1) interval_days = 1;
      else if (reps === 2) interval_days = 6;
      else interval_days = Math.round(interval_days * ease);
      ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    }
    const due_on = new Date(Date.now() + interval_days * 86400000).toISOString().slice(0, 10);
    const { error } = await context.supabase.from("flashcards")
      .update({ ease, reps, interval_days, due_on }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { due_on };
  });

export const deleteCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("flashcards").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ NOTES & GRAPH ============ */
export const listNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("learn_notes").select("*").order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    id: uuid.optional(),
    title: z.string().min(1).max(200),
    body: z.string().max(20000).default(""),
    tags: z.array(z.string().max(30)).max(20).default([]),
    links: z.array(uuid).max(50).default([]),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("learn_notes").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await context.supabase.from("learn_notes").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("learn_notes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ LEARNING GOALS ============ */
export const listLearningGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("learning_goals").select("*").order("target_date", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertLearningGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({
    id: uuid.optional(),
    title: z.string().min(1).max(200),
    target_date: z.string().optional().nullable(),
    progress_pct: z.number().int().min(0).max(100).default(0),
    notes: z.string().max(1000).optional().nullable(),
  }).parse(v))
  .handler(async ({ data, context }) => {
    const payload = { ...data, target_date: data.target_date || null, user_id: context.userId };
    if (data.id) {
      const { error } = await context.supabase.from("learning_goals").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("learning_goals").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteLearningGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: uuid }).parse(v))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("learning_goals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
