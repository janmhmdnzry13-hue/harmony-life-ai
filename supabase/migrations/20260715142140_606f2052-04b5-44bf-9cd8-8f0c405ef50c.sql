
-- CALENDAR
CREATE TABLE public.time_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  title text NOT NULL,
  category text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_blocks TO authenticated;
GRANT ALL ON public.time_blocks TO service_role;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own time_blocks" ON public.time_blocks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_time_blocks_updated BEFORE UPDATE ON public.time_blocks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  attendees text[] DEFAULT '{}',
  location text,
  agenda text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own meetings" ON public.meetings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_meetings_updated BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- PROJECTS extension
CREATE TABLE public.project_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_columns TO authenticated;
GRANT ALL ON public.project_columns TO service_role;
ALTER TABLE public.project_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cols" ON public.project_columns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_project_columns_updated BEFORE UPDATE ON public.project_columns FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.project_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  column_id uuid REFERENCES public.project_columns(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  position int NOT NULL DEFAULT 0,
  due_date date,
  assignees text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_cards TO authenticated;
GRANT ALL ON public.project_cards TO service_role;
ALTER TABLE public.project_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards" ON public.project_cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_project_cards_updated BEFORE UPDATE ON public.project_cards FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.project_deps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id uuid NOT NULL REFERENCES public.project_cards(id) ON DELETE CASCADE,
  depends_on_card_id uuid NOT NULL REFERENCES public.project_cards(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (card_id, depends_on_card_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_deps TO authenticated;
GRANT ALL ON public.project_deps TO service_role;
ALTER TABLE public.project_deps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own deps" ON public.project_deps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DOCUMENTS
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  file_path text,
  mime text,
  size bigint,
  expires_on date,
  notes text,
  ocr_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own documents" ON public.documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Documents bucket policies (bucket created via storage tool)
CREATE POLICY "own doc read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own doc write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own doc update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own doc delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- PEOPLE
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  relation text NOT NULL DEFAULT 'other',
  email text,
  phone text,
  birthday date,
  notes text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.gift_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  title text NOT NULL,
  occasion text,
  budget numeric,
  url text,
  status text NOT NULL DEFAULT 'idea',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_ideas TO authenticated;
GRANT ALL ON public.gift_ideas TO service_role;
ALTER TABLE public.gift_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own gifts" ON public.gift_ideas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_gift_ideas_updated BEFORE UPDATE ON public.gift_ideas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.communication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  cadence_days int NOT NULL DEFAULT 30,
  last_contacted_on date,
  next_due_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_reminders TO authenticated;
GRANT ALL ON public.communication_reminders TO service_role;
ALTER TABLE public.communication_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own comm reminders" ON public.communication_reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_comm_reminders_updated BEFORE UPDATE ON public.communication_reminders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- TRAVEL
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  destination text,
  starts_on date,
  ends_on date,
  budget numeric,
  notes text,
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trips" ON public.trips FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_trips_updated BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.trip_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'activity',
  title text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  cost numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_items TO authenticated;
GRANT ALL ON public.trip_items TO service_role;
ALTER TABLE public.trip_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trip items" ON public.trip_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_trip_items_updated BEFORE UPDATE ON public.trip_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.packing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  label text NOT NULL,
  packed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packing_items TO authenticated;
GRANT ALL ON public.packing_items TO service_role;
ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own packing" ON public.packing_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_packing_items_updated BEFORE UPDATE ON public.packing_items FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.travel_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  title text,
  body text,
  photos text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_journal TO authenticated;
GRANT ALL ON public.travel_journal TO service_role;
ALTER TABLE public.travel_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal" ON public.travel_journal FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_travel_journal_updated BEFORE UPDATE ON public.travel_journal FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ASSISTANT REVIEWS
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  body_md text NOT NULL,
  highlights text[] DEFAULT '{}',
  suggestions text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
