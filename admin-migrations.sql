-- ── 0. PROFILES Table & Trigger ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Trigger function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users from auth.users into public.profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Users can manage own profile'
  ) THEN
    CREATE POLICY "Users can manage own profile" ON public.profiles
      FOR ALL
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ── 1. Admin read policy on PROFILES ─────────────────────────────────
-- Allow a user whose user_metadata.role = 'admin' to read all profile rows.
-- The standard RLS only allows self-reads; this adds the admin bypass.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Admin can read all profiles'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admin can read all profiles" ON public.profiles
        FOR SELECT
        USING (
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''admin''
          OR (auth.jwt() -> ''raw_user_meta_data'' ->> ''role'') = ''admin''
        )
    ';
  END IF;
END $$;


-- ── 2. AI_CHATS table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_chats (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vehicle_id      uuid,
  user_message    text,
  ai_response     text,
  issue_name      text,
  likely_cause    text,
  urgency_level   text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_chats'
      AND policyname = 'Users can view own ai_chats'
  ) THEN
    CREATE POLICY "Users can view own ai_chats" ON public.ai_chats
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_chats'
      AND policyname = 'Admin can read all ai_chats'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admin can read all ai_chats" ON public.ai_chats
        FOR SELECT
        USING (
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''admin''
          OR (auth.jwt() -> ''raw_user_meta_data'' ->> ''role'') = ''admin''
        )
    ';
  END IF;
END $$;


-- ── 3. SUBSCRIPTIONS table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  email                 text,
  status                text NOT NULL DEFAULT 'trialing', -- pending | active | expired | cancelled | trialing
  plan_name             text NOT NULL DEFAULT 'pro',
  billing_cycle         text DEFAULT 'monthly',
  starts_at             timestamptz,
  ends_at               timestamptz,
  payment_method        text,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Note: Ensure old columns from messy historical schemas are mapped or ignored.
DO $$
BEGIN
  BEGIN ALTER TABLE public.subscriptions RENAME COLUMN plan TO plan_name; EXCEPTION WHEN undefined_column THEN END;
  BEGIN ALTER TABLE public.subscriptions RENAME COLUMN billing_interval TO billing_cycle; EXCEPTION WHEN undefined_column THEN END;
  BEGIN ALTER TABLE public.subscriptions RENAME COLUMN current_period_start TO starts_at; EXCEPTION WHEN undefined_column THEN END;
  BEGIN ALTER TABLE public.subscriptions RENAME COLUMN current_period_end TO ends_at; EXCEPTION WHEN undefined_column THEN END;
END $$;
-- Make sure new payment_method and notes columns definitely exist 
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS notes text;


ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions'
      AND policyname = 'Users can view own subscription'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own subscription" ON public.subscriptions
      FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Admin can read all subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions'
      AND policyname = 'Admin can read all subscriptions'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admin can read all subscriptions" ON public.subscriptions
        FOR SELECT
        USING (
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''admin''
          OR (auth.jwt() -> ''raw_user_meta_data'' ->> ''role'') = ''admin''
        )
    ';
  END IF;
  
  -- Admin can update all subscriptions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions'
      AND policyname = 'Admin can update subscriptions'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admin can update subscriptions" ON public.subscriptions
        FOR UPDATE
        USING (
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''admin''
          OR (auth.jwt() -> ''raw_user_meta_data'' ->> ''role'') = ''admin''
        )
    ';
  END IF;
  
  -- Admin can insert all subscriptions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions'
      AND policyname = 'Admin can insert subscriptions'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admin can insert subscriptions" ON public.subscriptions
        FOR INSERT
        WITH CHECK (
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''admin''
          OR (auth.jwt() -> ''raw_user_meta_data'' ->> ''role'') = ''admin''
        )
    ';
  END IF;
END $$;


-- ── 4. APP_EVENTS table ───────────────────────────────────────────────
-- Tracks mechanic clicks, towing clicks, and future analytics events.
CREATE TABLE IF NOT EXISTS public.app_events (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, -- 'mechanic_click' | 'towing_click' | 'map_view' | 'ai_analysis'
  metadata   jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_events'
      AND policyname = 'Users can insert own events'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own events" ON public.app_events
      FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_events'
      AND policyname = 'Admin can read all events'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admin can read all events" ON public.app_events
        FOR SELECT
        USING (
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''admin''
          OR (auth.jwt() -> ''raw_user_meta_data'' ->> ''role'') = ''admin''
        )
    ';
  END IF;
END $$;


-- ── 5. Seed subscriptions from existing profiles ──────────────────────
-- Backfills historical users so the subscriptions page isn't empty immediately.
-- Uses metadata stored in auth.users for trial dates where available.
INSERT INTO public.subscriptions (user_id, email, status, plan_name, starts_at, ends_at, created_at)
SELECT
  p.id,
  p.email,
  'trialing',
  'pro',
  p.created_at,
  p.created_at + interval '3 days',
  p.created_at
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- ── 6. SHARED_REPORTS table ─────────────────────────────────────────────
-- Stores a snapshot of a diagnostic report to be shared via public link.
CREATE TABLE IF NOT EXISTS public.shared_reports (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token            text UNIQUE NOT NULL, -- e.g., 'CX-1A2B3C'
  report_id        uuid REFERENCES public.ai_chats(id) ON DELETE CASCADE, -- Nullable to decouple from history saving
  created_by       uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vehicle_data     jsonb NOT NULL,
  diagnosis_data   jsonb NOT NULL,
  messages         jsonb DEFAULT '[]', -- conversation context
  customer_data    jsonb DEFAULT '{}', -- customer name, email, etc.
  summary          text, -- text summary of the report
  created_at       timestamptz DEFAULT now()
);

-- Ensure existing table is updated (in case columns already exist or need rename)
-- Note: Manually running these in Supabase is recommended if Rename is needed.
ALTER TABLE public.shared_reports ALTER COLUMN report_id DROP NOT NULL;
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shared_reports' AND column_name='token') THEN
    ALTER TABLE public.shared_reports RENAME COLUMN share_id TO token;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shared_reports' AND column_name='created_by') THEN
    ALTER TABLE public.shared_reports RENAME COLUMN user_id TO created_by;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shared_reports' AND column_name='customer_data') THEN
    ALTER TABLE public.shared_reports ADD COLUMN customer_data jsonb DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shared_reports' AND column_name='summary') THEN
    ALTER TABLE public.shared_reports ADD COLUMN summary text;
  END IF;
END $$;


-- Public read access by share_id
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shared_reports'
      AND policyname = 'Anyone can view shared reports'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can view shared reports" ON public.shared_reports FOR SELECT USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shared_reports'
      AND policyname = 'Users can insert own shared reports'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own shared reports" ON public.shared_reports FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;


-- ── 7. MECHANIC_LEADS table ───────────────────────────────────────────
-- Captures emails/phones from external mechanics viewing shared reports.
CREATE TABLE IF NOT EXISTS public.mechanic_leads (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id        uuid REFERENCES public.ai_chats(id) ON DELETE SET NULL, -- Nullable to decouple from history
  shared_link_id   uuid REFERENCES public.shared_reports(id) ON DELETE CASCADE, -- Link to the shared report snapshot
  contact_value    text NOT NULL,
  contact_type     text NOT NULL, -- 'phone' or 'email'
  source           text DEFAULT 'shared_report_modal',
  submitted_at     timestamptz DEFAULT now() -- Canonical name for user's reports
);

-- Ensure existing table is updated
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mechanic_leads' AND column_name='shared_link_id') THEN
    ALTER TABLE public.mechanic_leads RENAME COLUMN report_id TO shared_link_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mechanic_leads' AND column_name='report_id') THEN
    ALTER TABLE public.mechanic_leads ADD COLUMN report_id uuid REFERENCES public.ai_chats(id) ON DELETE SET NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mechanic_leads' AND column_name='share_id') THEN
     ALTER TABLE public.mechanic_leads DROP COLUMN share_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mechanic_leads' AND column_name='submitted_at') THEN
    ALTER TABLE public.mechanic_leads RENAME COLUMN created_at TO submitted_at;
  END IF;
END $$;


-- Anyone can insert leads (from the public report page)
ALTER TABLE public.mechanic_leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mechanic_leads'
      AND policyname = 'Anyone can insert mechanic leads'
  ) THEN
    EXECUTE 'CREATE POLICY "Anyone can insert mechanic leads" ON public.mechanic_leads FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

-- Only admins can read leads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mechanic_leads'
      AND policyname = 'Admin can read mechanic leads'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admin can read mechanic leads" ON public.mechanic_leads
        FOR SELECT
        USING (
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''admin''
          OR (auth.jwt() -> ''raw_user_meta_data'' ->> ''role'') = ''admin''
        )
    ';
  END IF;
END $$;

-- ── Done ──────────────────────────────────────────────────────────────
-- After running this, visit /admin in the app — all pages should show real data.

