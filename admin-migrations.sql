-- ============================================================
-- Carxai Admin Dashboard — Database Migrations
-- Run this ONCE in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

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


-- ── 2. Admin read policy on AI_CHATS ──────────────────────────────────
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
-- Real structure ready for Polar/Stripe webhook sync.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  email                 text,
  status                text NOT NULL DEFAULT 'trialing', -- trialing | active | canceled | past_due
  plan                  text NOT NULL DEFAULT 'Pro',
  billing_interval      text DEFAULT 'monthly',
  trial_starts_at       timestamptz,
  trial_ends_at         timestamptz,
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  polar_subscription_id text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscription
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
INSERT INTO public.subscriptions (user_id, email, status, plan, trial_starts_at, trial_ends_at, created_at)
SELECT
  p.id,
  p.email,
  'trialing',
  'Pro',
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

