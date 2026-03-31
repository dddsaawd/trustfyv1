ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS initiate_checkout integer DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS cost_per_ic numeric DEFAULT 0;