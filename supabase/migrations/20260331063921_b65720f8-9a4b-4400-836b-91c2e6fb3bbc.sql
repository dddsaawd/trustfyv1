
ALTER TABLE public.cost_settings 
ADD COLUMN IF NOT EXISTS gateway_pix_fixed numeric NOT NULL DEFAULT 0;
