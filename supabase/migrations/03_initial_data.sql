-- Migration 03: Create all required tables (idempotent) and apply RLS policies
-- This migration is safe to run multiple times (CREATE IF NOT EXISTS, DROP POLICY IF EXISTS)

-- ============================================================
-- TABLE: profesoria_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profesoria_profiles (
    username TEXT PRIMARY KEY,
    name TEXT,
    current_level TEXT DEFAULT 'Beginner',
    target_level TEXT DEFAULT 'Intermediate',
    xp_total INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    daily_xp INTEGER DEFAULT 0,
    daily_goal INTEGER DEFAULT 50,
    last_practice_at TIMESTAMPTZ,
    interests TEXT[] DEFAULT '{}',
    badges TEXT[] DEFAULT '{}',
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: profesoria_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS profesoria_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL REFERENCES profesoria_profiles(username) ON DELETE CASCADE,
    session_type TEXT NOT NULL,
    scenario TEXT,
    duration_seconds INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    score NUMERIC DEFAULT 0,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: profesoria_pronunciation
-- ============================================================
CREATE TABLE IF NOT EXISTS profesoria_pronunciation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL REFERENCES profesoria_profiles(username) ON DELETE CASCADE,
    phrase TEXT NOT NULL,
    score NUMERIC DEFAULT 0,
    feedback TEXT,
    word_analysis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE: profesoria_course_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS profesoria_course_progress (
    username TEXT PRIMARY KEY REFERENCES profesoria_profiles(username) ON DELETE CASCADE,
    syllabus TEXT[] DEFAULT '{}',
    completed_lessons TEXT[] DEFAULT '{}',
    current_module_index INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profesoria_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesoria_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesoria_pronunciation ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesoria_course_progress ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: profesoria_profiles
-- ============================================================
DROP POLICY IF EXISTS "Users can view all profiles" ON profesoria_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profesoria_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profesoria_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profesoria_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profesoria_profiles;

CREATE POLICY "Users can view all profiles"
ON profesoria_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own profile"
ON profesoria_profiles FOR INSERT
WITH CHECK (auth.uid()::text = username);

CREATE POLICY "Users can update own profile"
ON profesoria_profiles FOR UPDATE
USING (auth.uid()::text = username);

CREATE POLICY "Users can delete own profile"
ON profesoria_profiles FOR DELETE
USING (auth.uid()::text = username);

-- ============================================================
-- RLS POLICIES: profesoria_sessions
-- ============================================================
DROP POLICY IF EXISTS "Users can view own sessions" ON profesoria_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON profesoria_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON profesoria_sessions;

CREATE POLICY "Users can view own sessions"
ON profesoria_sessions FOR SELECT
USING (auth.uid()::text = username);

CREATE POLICY "Users can insert own sessions"
ON profesoria_sessions FOR INSERT
WITH CHECK (auth.uid()::text = username);

CREATE POLICY "Users can delete own sessions"
ON profesoria_sessions FOR DELETE
USING (auth.uid()::text = username);

-- ============================================================
-- RLS POLICIES: profesoria_pronunciation
-- ============================================================
DROP POLICY IF EXISTS "Users can view own pronunciation" ON profesoria_pronunciation;
DROP POLICY IF EXISTS "Users can insert own pronunciation" ON profesoria_pronunciation;
DROP POLICY IF EXISTS "Users can delete own pronunciation" ON profesoria_pronunciation;

CREATE POLICY "Users can view own pronunciation"
ON profesoria_pronunciation FOR SELECT
USING (auth.uid()::text = username);

CREATE POLICY "Users can insert own pronunciation"
ON profesoria_pronunciation FOR INSERT
WITH CHECK (auth.uid()::text = username);

CREATE POLICY "Users can delete own pronunciation"
ON profesoria_pronunciation FOR DELETE
USING (auth.uid()::text = username);

-- ============================================================
-- RLS POLICIES: profesoria_course_progress
-- ============================================================
DROP POLICY IF EXISTS "Users can manage own progress" ON profesoria_course_progress;

CREATE POLICY "Users can manage own progress"
ON profesoria_course_progress FOR ALL
USING (auth.uid()::text = username)
WITH CHECK (auth.uid()::text = username);