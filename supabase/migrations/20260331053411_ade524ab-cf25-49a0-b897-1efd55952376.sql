ALTER TABLE public.ad_accounts ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'ok';
ALTER TABLE public.ad_accounts ADD COLUMN IF NOT EXISTS payment_status_detail text DEFAULT null;