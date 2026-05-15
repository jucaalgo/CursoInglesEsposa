-- Migration 02: Leaderboard view for secure access
-- Creates a view that exposes only the fields needed for the leaderboard,
-- avoiding the need to SELECT * from profesoria_profiles.

-- 1. Create leaderboard view (limited fields)
CREATE OR REPLACE VIEW profesoria_leaderboard AS
SELECT
    username,
    name,
    current_level,
    xp_total,
    streak_count,
    daily_xp,
    daily_goal
FROM profesoria_profiles;

-- 2. Grant access to authenticated users
GRANT SELECT ON profesoria_leaderboard TO authenticated;

-- 3. Update the existing RLS policy for profiles to be more restrictive
-- Replace the overly permissive "Users can view all profiles" policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profesoria_profiles;

-- Create new policy: users can only see their own full profile
CREATE POLICY "Users can view own profile"
ON profesoria_profiles FOR SELECT
TO authenticated
USING (auth.uid()::text = username);

-- Allow select on leaderboard view for all authenticated users
-- (The view already limits what columns are visible)
CREATE POLICY "Authenticated users can view leaderboard"
ON profesoria_leaderboard FOR SELECT
TO authenticated
USING (true);