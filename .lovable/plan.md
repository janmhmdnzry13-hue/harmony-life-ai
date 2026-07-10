# Life OS Foundation — Build Plan

Your app already has the core scaffolding: auth (email + Google), account page, dashboard (Today), Tasks, Habits, Calendar, Finance, AI (Origin), profile, and the warm paper editorial design system on mobile-first TanStack Start + Supabase. This plan **extends** that foundation rather than rebuilding it.

## What's already done (skip)
Dashboard, Auth, User Profile, Navigation, Calendar, Task Management, Habit Tracker, AI assistant, Responsive mobile-first, Cloud Sync (Supabase), Beautiful UI (warm paper editorial).

## What to add

### 1. Data model (one migration)
New tables, all with RLS scoped to `auth.uid()`, GRANTs to authenticated + service_role, `updated_at` triggers:
- `projects` — name, description, color, status (active/archived), due_date
- `goals` — title, description, target_date, progress (0–100), status, linked project_id (nullable)
- `notes` — title, content (markdown), tags text[], pinned
- `journal_entries` — entry_date (unique per user+date), content, mood, gratitude
- `brain_dumps` — content, processed (bool) — quick capture inbox
- `notifications` — title, body, read_at, kind, link
- `user_settings` — theme ('light'|'dark'|'system'), timezone, notification_prefs jsonb, daily_summary_time
- Add `project_id` (nullable) + `goal_id` (nullable) to `tasks` for linking

### 2. New routes (under `_authenticated/`)
- `/projects` + `/projects/$projectId` — project list + detail with linked tasks/goals
- `/goals` — goals with progress rings
- `/notes` + `/notes/$noteId` — notes list + markdown editor
- `/journal` — day-by-day journal with mood/gratitude
- `/brain-dump` — fast capture textarea, convert to task/note
- `/planner` — daily planner combining today's tasks, events, habits, journal prompt
- `/search` — global cmd-k style search across tasks/notes/journal/projects/goals
- `/settings` — theme, notifications, timezone, data export, danger zone

### 3. Cross-cutting features
- **Light/Dark mode**: add dark variant to `styles.css` tokens (paper/ink invert), theme provider reading `user_settings.theme` + system preference, toggle in Settings + Account
- **Search**: `Cmd/Ctrl+K` command palette (existing shadcn Command component), server fn doing multi-table ilike search
- **Notifications**: bell icon in header, dropdown list, mark-read; created by triggers (task due today, habit streak, AI summary ready)
- **AI Daily Summary**: server fn using Lovable AI (`openai/gpt-5.5`) that reads today's tasks/habits/events/mood and returns a 3-part summary (Focus, Wins, Gentle nudge). Shown on Dashboard + Planner. Cached per day in `ai_messages` or new `ai_summaries` table.
- **AI Dashboard Insights**: server fn analyzing 7-day trends (task completion rate, habit consistency, mood curve, spending) → 2–3 insight cards on Dashboard
- **Offline Support (PWA)**: manifest + icons for installability. Full offline caching only if you explicitly want it — adds complexity and cache-busting concerns. Default here is installable + online.

### 4. Navigation update
Bottom tab bar stays 5 slots (Today, Tasks, Origin, Habits, Money). Add an in-header "More" menu (or long-press the center) that opens a sheet with: Projects, Goals, Notes, Journal, Planner, Brain Dump, Calendar, Finance, Settings, Search. This keeps the mobile bar clean while surfacing depth.

## Scope check before I build

This is a large build (~15 new routes, 7 new tables, PWA setup, theming, AI summary + insights, search palette, notifications). To keep quality high I'll ship it in **3 phases** and pause between each so you can steer:

- **Phase 1 — Data + Settings + Theme**: migration for all new tables, Settings page, dark mode toggle working end-to-end, notifications table + header bell (empty state).
- **Phase 2 — Capture surfaces**: Projects, Goals, Notes, Journal, Brain Dump, Planner, Search palette, More menu.
- **Phase 3 — AI + PWA**: AI Daily Summary + Dashboard Insights, notification triggers, PWA manifest + install prompt.

## Questions before I start

1. **Dark mode default**: system-follow, or force dark? (Recommend: system.)
2. **PWA scope**: installable-only, or full offline (adds complexity)? (Recommend: installable-only for v1.)
3. **Notifications**: in-app bell only for v1, or also browser push? (Recommend: in-app only; push later.)
4. **Confirm 3-phase delivery** — reply "go phase 1" and I'll start, or tell me to compress/reorder.
