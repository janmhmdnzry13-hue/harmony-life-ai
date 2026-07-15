## Scope

Add a **Productivity & Relationships OS** alongside Wealth OS and Wellness OS. Five new hubs plus an AI productivity assistant, all following the existing editorial ink/paper/serif design and the `createServerFn + requireSupabaseAuth + zod` pattern.

## Navigation

Bottom nav is full (5 slots). Add a **"More"** hub at `/more` that fans out into the new sections, and promote the most-used one (**Calendar**) by replacing the existing `/calendar` route with a richer version.

New top-level sections:

1. **Calendar** `/calendar` (upgrade) → Month · Week · Time Blocks · Meetings · Sync
2. **Projects** `/projects` → Kanban · Timeline · Dependencies
3. **Docs** `/docs` → Vault · Scanner · Categories (Passport / ID / Contract / Receipt)
4. **People** `/people` → Contacts · Family · Friends · Birthdays · Gifts · Reminders
5. **Travel** `/travel` → Trips · Packing · Budget · Journal
6. **Assistant** `/assistant` → Weekly · Monthly · Reports · Suggestions

`/more` lists these six as editorial cards. Bottom nav stays: Home · Wellness · Origin · Habits · Money (More is reached from the header, and Origin/AI already covers quick chat).

## Data model (new tables)

All: `user_id` + RLS `auth.uid() = user_id`, GRANTs to authenticated + service_role, `updated_at` trigger.

```text
Calendar
  time_blocks         date, start_time, end_time, title, category, notes
  meetings            starts_at, ends_at, title, attendees[], location, agenda, notes
  calendar_sync       provider (google/outlook), connection_key_ref, last_sync_at, enabled

Projects
  projects_v2         name, description, status, color, archived         (rename existing `projects` view or reuse; existing table stays)
  project_columns     project_id, name, position
  project_cards       project_id, column_id, title, description, position, due_date, assignees[]
  project_deps        card_id, depends_on_card_id
  project_members     project_id, user_id, role

Documents
  documents           title, category (passport/id/contract/receipt/other), file_path (storage), mime, size, expires_on, notes, ocr_text
  (storage bucket: `documents`, private, RLS by user_id prefix)

People
  contacts            name, relation (family/friend/colleague/other), email, phone, birthday, notes, avatar_url
  gift_ideas          contact_id, title, occasion, budget, url, status (idea/bought/given), notes
  communication_reminders  contact_id, cadence_days, last_contacted_on, next_due_on

Travel
  trips               title, destination, starts_on, ends_on, budget, notes, cover_url
  trip_items          trip_id, kind (flight/hotel/activity/transport), title, starts_at, ends_at, cost, notes
  packing_lists       trip_id, name
  packing_items       list_id, label, packed
  travel_journal      trip_id, entry_date, title, body, photos[]

Assistant
  reviews             kind (weekly/monthly), period_start, period_end, body_md, highlights[], suggestions[]
```

## Server functions (new files)

```text
src/lib/calendar/time-blocks.functions.ts, meetings.functions.ts, sync.functions.ts
src/lib/projects.functions.ts (kanban CRUD, deps, members)
src/lib/documents.functions.ts (list/upsert/delete + signed URLs + OCR trigger)
src/lib/people/contacts.functions.ts, gifts.functions.ts, reminders.functions.ts
src/lib/travel.functions.ts (trips, items, packing, journal)
src/lib/assistant.functions.ts (weekly/monthly review + suggestions via Gemini)
```

Every file follows the existing pattern (`createServerFn + requireSupabaseAuth + zod`).

## Calendar sync (Google + Outlook)

Uses **App User Connectors** — each end user connects their own account. Set up two clients (`google_calendar`, `microsoft_outlook`) via `connector_app_user--connect_client`, then per-user consent → store encrypted connection key in `app_user_connections` (shipped pattern). A server fn pulls the next 14 days of events on demand and merges them read-only into the calendar view; local `events` + `time_blocks` remain writable. No two-way write in v1.

## Documents / OCR

- Private Supabase Storage bucket `documents` with `user_id/...` prefix RLS.
- Upload from the browser via signed upload URL.
- OCR: server fn calls Lovable AI Gateway (`google/gemini-2.5-flash`) with the file as an image/PDF part; returns extracted text stored in `documents.ocr_text`. Searchable via ILIKE.
- Expiry reminder: `documents.expires_on` powers a "Expiring soon" list on the vault page.

## Relationships

- Birthday reminders and communication cadence computed client-side from `contacts.birthday` and `communication_reminders.next_due_on`; surfaced on Home under a new "Coming up" card.
- Gift planner is a simple board grouped by contact.

## Travel

- Trip detail page with itinerary (trip_items sorted by `starts_at`), packing checklist, running budget total, and a journal timeline.

## AI Productivity Assistant

- **Weekly Review**: aggregates last 7d of tasks, habits, calendar, mood, finance signals → Gemini prompt returns markdown review (wins / friction / next-week focus). Cached in `reviews`.
- **Monthly Review**: same shape, 30d window.
- **Smart Suggestions**: on-demand `google/gemini-2.5-flash` call returning 3 concrete next actions given current unfinished tasks + upcoming events.
- All through Lovable AI Gateway — no user key.

## Route files

```text
src/routes/_authenticated/
  calendar.tsx (upgrade to layout with tabs)
  calendar.index.tsx (month) · calendar.week.tsx · calendar.blocks.tsx · calendar.meetings.tsx · calendar.sync.tsx
  projects.tsx (layout) · projects.index.tsx (list) · projects.$id.tsx (kanban) · projects.$id.timeline.tsx
  docs.tsx (layout) · docs.index.tsx (vault) · docs.scan.tsx · docs.$id.tsx
  people.tsx (layout) · people.index.tsx (contacts) · people.birthdays.tsx · people.gifts.tsx · people.reminders.tsx
  travel.tsx (layout) · travel.index.tsx (trips) · travel.$id.tsx (detail)
  assistant.tsx (layout) · assistant.index.tsx (dashboard) · assistant.weekly.tsx · assistant.monthly.tsx · assistant.suggestions.tsx
  more.tsx (hub of the above)
```

Existing `/calendar` route becomes the new layout; its current month view moves to `calendar.index.tsx`.

## Deliverables (in order)

1. Migration: all new tables + storage bucket + RLS + GRANTs + triggers.
2. App User Connector clients for Google Calendar + Microsoft Outlook, with encrypted per-user key storage table.
3. Server functions per module.
4. Route files with sub-tabs and editorial UI.
5. AI reviews + suggestions.
6. `/more` hub + header entry point.

## Out of scope (v1)

- Two-way calendar write-back to Google/Outlook (read-only merge only).
- Team collaboration for Projects across separate accounts (single-user; `project_members` table is ready but UI is solo).
- Real-time OCR on-device — server-side via Gemini only.
- File preview for non-PDF/image documents.
- Native travel booking integrations.
- Push notifications (in-app reminders only).

Ready to build on approval.
