
ALTER TABLE public.cost_settings 
ADD COLUMN IF NOT EXISTS gateway_provider text DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS gateway_pix_percent numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS gateway_card_percent numeric NOT NULL DEFAULT 4.99;
