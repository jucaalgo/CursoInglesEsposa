-- Migration 02: Leaderboard view for secure access
-- Creates a view that exposes only the fields needed for the leaderboard,
-- avoiding the need to SELECT * from profesoria_profiles.

-- 1. Create leaderboard view (limited fields, filters out null usernames)
CREATE OR REPLACE VIEW profesoria_leaderboard AS
SELECT
    username,
    name,
    current_level,
    xp_total,
    streak_count,
    daily_xp,
    daily_goal
FROM profesoria_profiles
WHERE username IS NOT NULL;

-- 2. Grant access to authenticated users
GRANT SELECT ON profesoria_leaderboard TO authenticated;