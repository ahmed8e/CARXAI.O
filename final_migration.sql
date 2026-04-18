-- BEGIN TRANSACTION
BEGIN;

-- 1. UNIFY PROFILES TABLE
-- Add missing columns to profiles if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS latitude float8,
ADD COLUMN IF NOT EXISTS longitude float8,
ADD COLUMN IF NOT EXISTS location_timestamp bigint,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'Free',
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. MIGRATE DATA FROM USER_SETTINGS (Optional cleanup)
-- Move existing settings to profiles where they match on user_id
UPDATE public.profiles p
SET 
  phone_number = s.phone_number,
  preferred_language = s.preferred_language
FROM public.user_settings s
WHERE p.id = s.user_id;

-- 3. FIX SERVICE_PROVIDERS_RAW
-- Ensure assigned_user_id exists and references auth.users
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_providers_raw' AND column_name='assigned_user_id') THEN
    ALTER TABLE public.service_providers_raw ADD COLUMN assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. REFRESH SCHEMA CACHE POLICIES
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view assigned providers" ON public.service_providers_raw;
DROP POLICY IF EXISTS "Admins can manage all providers" ON public.service_providers_raw;

-- New Unified View Policy
CREATE POLICY "Users can view assigned providers" ON public.service_providers_raw
FOR SELECT USING (
  auth.uid() = assigned_user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (subscription_tier = 'Admin' OR role = 'admin' OR email LIKE '%@carx.ai')
  )
);

-- Separate Admin Manage Policy
CREATE POLICY "Admins can manage all providers" ON public.service_providers_raw
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR subscription_tier = 'Admin')
  )
);

-- 5. ENSURE RLS ON PROFILES IS COMPREHENSIVE
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- COMMIT TRANSACTION
COMMIT;
