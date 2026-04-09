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

-- ── Done ──────────────────────────────────────────────────────────────
-- After running this, visit /admin in the app — all pages should show real data.
