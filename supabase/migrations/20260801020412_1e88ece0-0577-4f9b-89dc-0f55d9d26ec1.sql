CREATE TABLE public.ai_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'fact',
  content text NOT NULL,
  importance integer NOT NULL DEFAULT 3,
  source text NOT NULL DEFAULT 'chat',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memories TO authenticated;
GRANT ALL ON public.ai_memories TO service_role;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memories" ON public.ai_memories FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ai_memories_updated_at BEFORE UPDATE ON public.ai_memories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.life_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  life_score integer NOT NULL DEFAULT 0,
  health_score integer NOT NULL DEFAULT 0,
  finance_score integer NOT NULL DEFAULT 0,
  productivity_score integer NOT NULL DEFAULT 0,
  happiness_score integer NOT NULL DEFAULT 0,
  burnout_risk integer NOT NULL DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, score_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.life_scores TO authenticated;
GRANT ALL ON public.life_scores TO service_role;
ALTER TABLE public.life_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own life scores" ON public.life_scores FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER life_scores_updated_at BEFORE UPDATE ON public.life_scores
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'recommendation',
  domain text NOT NULL DEFAULT 'life',
  title text NOT NULL,
  body text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  confidence integer NOT NULL DEFAULT 50,
  action_label text,
  action_link text,
  dismissed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own insights" ON public.ai_insights FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ai_insights_updated_at BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.ai_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_key text NOT NULL,
  name text NOT NULL,
  description text,
  schedule text NOT NULL DEFAULT 'daily',
  active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  last_result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, agent_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_automations TO authenticated;
GRANT ALL ON public.ai_automations TO service_role;
ALTER TABLE public.ai_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own automations" ON public.ai_automations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ai_automations_updated_at BEFORE UPDATE ON public.ai_automations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();