-- 1. Enable RLS on all tables
ALTER TABLE profesoria_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesoria_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesoria_pronunciation ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesoria_course_progress ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (to ensure clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON profesoria_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profesoria_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profesoria_profiles;

-- 3. Create RLS Policies

-- PROFILES
CREATE POLICY "Users can view all profiles" 
ON profesoria_profiles FOR SELECT 
TO authenticated
USING (true); -- Allow all authenticated users to read profiles (for Leaderboard)

CREATE POLICY "Users can update own profile" 
ON profesoria_profiles FOR UPDATE 
USING (auth.uid()::text = username);

CREATE POLICY "Users can delete own profile" 
ON profesoria_profiles FOR DELETE 
USING (auth.uid()::text = username);

CREATE POLICY "Users can insert own profile" 
ON profesoria_profiles FOR INSERT 
WITH CHECK (auth.uid()::text = username);

-- SESSIONS
CREATE POLICY "Users can view own sessions" 
ON profesoria_sessions FOR SELECT 
USING (auth.uid()::text = username);

CREATE POLICY "Users can insert own sessions" 
ON profesoria_sessions FOR INSERT 
WITH CHECK (auth.uid()::text = username);

CREATE POLICY "Users can delete own sessions" 
ON profesoria_sessions FOR DELETE 
USING (auth.uid()::text = username);

-- PRONUNCIATION
CREATE POLICY "Users can view own pronunciation" 
ON profesoria_pronunciation FOR SELECT 
USING (auth.uid()::text = username);

CREATE POLICY "Users can insert own pronunciation" 
ON profesoria_pronunciation FOR INSERT 
WITH CHECK (auth.uid()::text = username);

CREATE POLICY "Users can delete own pronunciation" 
ON profesoria_pronunciation FOR DELETE 
USING (auth.uid()::text = username);

-- COURSE PROGRESS
CREATE POLICY "Users can manage own progress" 
ON profesoria_course_progress FOR ALL 
USING (auth.uid()::text = username)
WITH CHECK (auth.uid()::text = username);
