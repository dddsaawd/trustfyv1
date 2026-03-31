-- Drop the partial unique index
DROP INDEX IF EXISTS campaigns_external_id_platform_user_id_key;

-- Create a proper unique constraint for upsert
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_user_external_platform_unique UNIQUE (user_id, external_id, platform);