ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS expires_on date;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS expires_on date;