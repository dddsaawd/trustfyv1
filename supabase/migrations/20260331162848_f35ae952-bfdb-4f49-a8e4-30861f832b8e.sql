
-- Add approved column to profiles (default false for new users, existing users get true)
ALTER TABLE public.profiles ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Set existing users as approved
UPDATE public.profiles SET approved = true;

-- Create a function to check if user is admin (has 'admin' role)
-- Already have has_role function, so we're good.

-- Create RLS policy so admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Drop the old select policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Allow admins to update any profile (for approval)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Drop old update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
