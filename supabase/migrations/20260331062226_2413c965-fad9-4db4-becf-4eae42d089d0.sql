-- Remove old campaigns without external_id (they'll be re-synced with proper IDs)
DELETE FROM public.campaigns WHERE external_id IS NULL;