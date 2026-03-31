ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_user_name_platform_account_unique;
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_user_id_name_platform_ad_account_id_key;
DROP INDEX IF EXISTS campaigns_user_name_platform_account_unique;
DROP INDEX IF EXISTS campaigns_user_id_name_platform_ad_account_id_key;
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_user_external_platform_unique;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_user_external_platform_unique UNIQUE (user_id, external_id, platform);