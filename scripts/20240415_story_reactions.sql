-- ─────────────────────────────────────────────────────────────────────────────
-- STORY REACTIONS SYSTEM MIGRATION
-- Project: Carsafety
-- Purpose: Real-time engagement tracking with seeded baseline social proof
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create Main Reactions Table
CREATE TABLE IF NOT EXISTS story_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id TEXT NOT NULL,
    reaction_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT, -- For anonymous tracking via localStorage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- UNIQUE CONSTRAINTS
    -- Prevent duplicate reactions from the same registered user per story
    CONSTRAINT unique_story_user UNIQUE (story_id, user_id),
    -- Prevent duplicate reactions from the same anonymous device session per story
    CONSTRAINT unique_story_session UNIQUE (story_id, session_id),
    
    -- DATA INTEGRITY
    -- Ensure exactly one of user_id or session_id is present
    CONSTRAINT id_method_enforcement CHECK (
        (user_id IS NOT NULL AND session_id IS NULL) OR
        (user_id IS NULL AND session_id IS NOT NULL)
    )
);

-- Performance Indexing
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON story_reactions(story_id);

-- 2. Create Baseline Table for Initial Social Proof Seeds
CREATE TABLE IF NOT EXISTS story_reaction_baselines (
    story_id TEXT NOT NULL,
    reaction_type TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (story_id, reaction_type)
);

-- 3. Seed Initial Social Proof Data
-- These numbers provide the "trust foundation" for the landing page
INSERT INTO story_reaction_baselines (story_id, reaction_type, count)
VALUES 
    ('carsafety-origin', 'relate', 4800),
    ('carsafety-origin', 'respect', 3100),
    ('carsafety-origin', 'powerful', 2700)
ON CONFLICT (story_id, reaction_type) 
DO UPDATE SET count = EXCLUDED.count;

-- 4. Create Unified Totals View
-- This view combines real user reactions with the baseline seeds
CREATE OR REPLACE VIEW view_story_reaction_totals AS
WITH real_counts AS (
    SELECT 
        story_id, 
        reaction_type, 
        COUNT(*) as real_user_count
    FROM story_reactions
    GROUP BY story_id, reaction_type
),
all_story_types AS (
    -- Combine all unique story/reaction pairs from both tables
    SELECT story_id, reaction_type FROM story_reaction_baselines
    UNION
    SELECT story_id, reaction_type FROM real_counts
)
SELECT 
    t.story_id,
    t.reaction_type,
    (COALESCE(b.count, 0) + COALESCE(r.real_user_count, 0))::INT as total_count
FROM all_story_types t
LEFT JOIN story_reaction_baselines b ON t.story_id = b.story_id AND t.reaction_type = b.reaction_type
LEFT JOIN real_counts r ON t.story_id = r.story_id AND t.reaction_type = r.reaction_type;

-- 5. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reaction_baselines ENABLE ROW LEVEL SECURITY;

-- 5a. Public Access: Read
CREATE POLICY "Allow public read access to reactions"
ON story_reactions FOR SELECT
USING (true);

CREATE POLICY "Allow public read access to baselines"
ON story_reaction_baselines FOR SELECT
USING (true);

-- 5b. Authenticated Users: Upsert (Insert or Update if they change their mind)
CREATE POLICY "Allow registered users to manage their own reaction"
ON story_reactions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5c. Anonymous Users: Manage by session_id
-- We allow INSERT for anon users as long as they provide a session_id
CREATE POLICY "Allow anonymous users to react"
ON story_reactions FOR INSERT
TO anon
WITH CHECK (user_id IS NULL AND session_id IS NOT NULL);

-- We allow UPDATE/SELECT for anon users where they match their own session_id
CREATE POLICY "Allow anonymous users to update their react"
ON story_reactions FOR ALL
TO anon
USING (user_id IS NULL AND session_id IS NOT NULL);

-- Review the results
-- SELECT * FROM view_story_reaction_totals WHERE story_id = 'carsafety-origin';
