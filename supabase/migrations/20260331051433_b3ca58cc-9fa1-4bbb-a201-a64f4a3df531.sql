-- Drop old unique index that doesn't support multi-account
DROP INDEX IF EXISTS campaigns_user_name_platform_unique;

-- Create new unique index including ad_account_id
CREATE UNIQUE INDEX campaigns_user_name_platform_account_unique 
ON public.campaigns (user_id, name, platform, ad_account_id);

-- Delete existing campaigns with NULL ad_account_id (will be re-synced with correct links)
DELETE FROM public.campaigns WHERE ad_account_id IS NULL;