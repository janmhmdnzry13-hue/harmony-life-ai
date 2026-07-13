## Scope

Add a **Wellness OS** alongside the existing Wealth OS, structured as four hubs plus an AI coach. Reuse the editorial ink/paper/serif design system and the same server-fn + RLS pattern already used by Finance.

The existing `habits` table stays (we extend it, not replace it). Everything else is new.

## Navigation

Four new top-level hubs, each with sub-tabs (segmented control):

1. **Health** `/health` → Sleep · Workouts · Nutrition · Water · Weight · Steps
2. **Mind** `/mind` → Mood · Gratitude · Reflection · Stress · Emotion Analysis (AI)
3. **Habits** `/habits` (upgrade existing) → Today · Streaks · Heatmap · Routines (Morning/Night)
4. **Learn** `/learn` → Courses · Books · Reading · Flashcards · Notes · Knowledge Graph · Goals
5. **Coach** `/coach` → Motivation · Habit suggestions · Burnout detection · Daily advice

Bottom nav updated: Home · Finance · Wellness · Habits · More.

## Data model (new tables)

All tables: `user_id` + RLS `auth.uid() = user_id`, GRANTs to authenticated + service_role, `updated_at` trigger.

```text
Health
  sleep_logs        date, bedtime, wake_time, duration_min, quality (1-5), notes
  workouts          date, type, duration_min, intensity, calories, notes
  workout_exercises workout_id, name, sets, reps, weight, notes
  nutrition_logs    date, meal (breakfast/lunch/dinner/snack), name, calories, protein, carbs, fat
  water_logs        date, amount_ml
  weight_logs       date, weight_kg, body_fat_pct?, notes
  step_logs         date, steps, distance_km?

Mind
  mood_logs         logged_at, mood (1-5), energy (1-5), tags[], notes
  gratitude_entries date, entries[] (3 items)
  reflection_entries date, prompt, body
  stress_logs       logged_at, level (1-10), triggers[], notes

Habits (extend existing habits table)
  routines          name, kind (morning/night), steps[], active
  routine_logs      routine_id, date, completed_steps[]

Learn
  courses           title, provider, url, status (planned/active/done), progress_pct, notes
  books             title, author, status (planned/reading/done), started_on, finished_on, rating, notes
  reading_sessions  book_id, date, minutes, pages, notes
  flashcard_decks   name, description
  flashcards        deck_id, front, back, ease, due_on, reps
  learn_notes       title, body, tags[], links[] (to other note ids)
  learning_goals    title, target_date, progress_pct, notes
```

`emotion_analysis` reuses `mood_logs` + `reflection_entries` + AI, no new table.

## Server functions (new files)

- `src/lib/health/sleep.functions.ts`, `workouts.functions.ts`, `nutrition.functions.ts`, `water.functions.ts`, `weight.functions.ts`, `steps.functions.ts`
- `src/lib/mind/mood.functions.ts`, `gratitude.functions.ts`, `reflection.functions.ts`, `stress.functions.ts`, `emotion.functions.ts` (AI)
- `src/lib/habits/routines.functions.ts`, `heatmap.functions.ts` (aggregates existing habit_logs)
- `src/lib/learn/courses.functions.ts`, `books.functions.ts`, `flashcards.functions.ts` (SM-2 lite scheduling), `learn-notes.functions.ts`, `learn-goals.functions.ts`
- `src/lib/wellness-coach.functions.ts` — sibling to finance coach, scopes: motivation, habits, burnout, daily

Each file follows the existing `createServerFn + requireSupabaseAuth + zod` pattern used by `tasks.functions.ts` / `coach.functions.ts`.

## AI features

- **Emotion Analysis** — Gemini reads last 14d of mood + reflections, returns a short editorial paragraph + top 3 emotion tags.
- **Wellness Coach** — mirrors `runCoach` in finance: aggregates sleep, workouts, mood, stress, habit streaks, then asks `google/gemini-2.5-flash` for a focused insight per scope.
- **Burnout detection** — heuristic (sleep < 6h avg, stress ≥ 7 avg, mood ≤ 2, missed habits) + AI framing.

All via Lovable AI gateway — no user key needed.

## Route files

```text
src/routes/_authenticated/
  health.tsx (layout with tabs)
  health.index.tsx  · health.workouts.tsx · health.nutrition.tsx
  health.water.tsx · health.weight.tsx · health.steps.tsx
  mind.tsx (layout)
  mind.index.tsx (mood) · mind.gratitude.tsx · mind.reflection.tsx
  mind.stress.tsx · mind.emotion.tsx
  habits.tsx (upgrade to layout with tabs)
  habits.index.tsx (today) · habits.streaks.tsx · habits.heatmap.tsx · habits.routines.tsx
  learn.tsx (layout)
  learn.index.tsx (courses) · learn.books.tsx · learn.flashcards.tsx
  learn.notes.tsx · learn.graph.tsx · learn.goals.tsx
  coach.tsx (wellness coach; finance coach stays at /finance/coach)
```

Mobile-first, matches existing editorial UI.

## Knowledge graph

Simple v1: `learn_notes.links` is a UUID[] of related note ids. Render as a force-directed SVG using a tiny in-house layout (no new deps). Click a node → open the note. No external graph libs.

## Flashcards

SM-2 lite: `ease` (default 2.5), `reps`, `due_on`. Review flow: show front → reveal → self-rate Again/Hard/Good/Easy → update `ease`, `reps`, `due_on`. Pure client interaction, server-fn to persist.

## Deliverables (in order)

1. Migration: all new tables with RLS + GRANTs + triggers + `routines` seed helper.
2. Server functions per module.
3. Route files with sub-tabs and editorial UI.
4. AI Emotion Analysis + Wellness Coach.
5. Bottom nav update in `src/components/app-shell.tsx`.

## Out of scope (v1)

- Wearable / HealthKit / Google Fit sync — manual entry only.
- Food database — free-text meal + macros.
- Image import for meals.
- Multi-user sharing of notes/graphs.
- Native step counter — manual daily entry.

Ready to build on approval.
