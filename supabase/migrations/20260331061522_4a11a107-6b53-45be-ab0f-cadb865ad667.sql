ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS external_id text;

-- Drop the old unique constraint and create a new one using external_id
DROP INDEX IF EXISTS campaigns_user_id_name_platform_ad_account_id_key;
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_user_id_name_platform_ad_account_id_key;

CREATE UNIQUE INDEX campaigns_external_id_platform_user_id_key ON public.campaigns (user_id, external_id, platform) WHERE external_id IS NOT NULL;