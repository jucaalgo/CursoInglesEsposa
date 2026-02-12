import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================
import { Profile, Session, PronunciationResult, CourseProgress } from '../types';

// ============================================
// PROFILE MANAGEMENT
// ============================================

/**
 * Get user profile from Supabase
 * Falls back to localStorage if Supabase fails
 */
export const getProfile = async (username: string): Promise<Profile | null> => {
    try {
        const { data, error } = await supabase
            .from('profesoria_profiles')
            .select('*')
            .eq('username', username);

        if (error) throw error;

        if (!data || data.length === 0) {
            return getProfileFromLocalStorage(username);
        }

        const profileData = data[0];

        // Save to localStorage as cache
        saveProfileToLocalStorage(username, profileData);
        return profileData;
    } catch (error) {
        console.warn('Supabase getProfile failed, using localStorage:', error);
        return getProfileFromLocalStorage(username);
    }
};

/**
 * Get ALL profiles from Supabase (for student selector)
 */
export const getAllProfiles = async (): Promise<Profile[]> => {
    try {
        const { data, error } = await supabase
            .from('profesoria_profiles')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.warn('Supabase getAllProfiles failed, using localStorage:', error);
        // Fallback: return profiles from localStorage
        const allKeys = Object.keys(localStorage).filter(k => k.startsWith('profesoria_profile_'));
        return allKeys.map(key => {
            try {
                return JSON.parse(localStorage.getItem(key) || '{}');
            } catch {
                return null;
            }
        }).filter(Boolean) as Profile[];
    }
};

/**
 * Save user profile to Supabase
 * Also saves to localStorage as backup
 */
export const saveProfile = async (username: string, profile: Partial<Profile>): Promise<void> => {
    const fullProfile: Profile = {
        username,
        name: profile.name || username,
        current_level: profile.current_level || 'A2',
        target_level: profile.target_level || 'B2',
        interests: profile.interests || [],
        xp_total: profile.xp_total || 0,
        streak_count: profile.streak_count || 0,
        last_practice_at: profile.last_practice_at,
        daily_xp: profile.daily_xp || 0,
        daily_goal: profile.daily_goal || 50,
        badges: profile.badges || []
    };

    // Save to localStorage first (always succeeds)
    saveProfileToLocalStorage(username, fullProfile);

    // Try to save to Supabase
    try {
        const { error } = await supabase
            .from('profesoria_profiles')
            .upsert(fullProfile, { onConflict: 'username' });

        if (error) throw error;
    } catch (_error) {
        // Silent fail for offline mode
        // console.warn('Supabase saveProfile failed (Offline Mode active)');
    }
};

/**
 * Update user XP and streak
 */
export const updateProgress = async (username: string, xpEarned: number): Promise<void> => {
    const profile = await getProfile(username);
    if (!profile) return;

    const today = new Date().toDateString();
    const lastPractice = profile.last_practice_at ? new Date(profile.last_practice_at).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let newStreak = profile.streak_count;
    if (lastPractice !== today) {
        // New day
        newStreak = lastPractice === yesterday ? newStreak + 1 : 1;
    }

    let newDailyXP = profile.daily_xp || 0;
    if (lastPractice !== today) {
        // New day reset
        newDailyXP = xpEarned;
    } else {
        newDailyXP += xpEarned;
    }

    await saveProfile(username, {
        ...profile,
        xp_total: profile.xp_total + xpEarned,
        daily_xp: newDailyXP,
        streak_count: newStreak,
        last_practice_at: new Date().toISOString()
    });
};

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Save a practice session
 */
export const saveSession = async (session: Session): Promise<void> => {
    // Save to localStorage
    saveSessionToLocalStorage(session);

    // Try to save to Supabase
    try {
        const { error } = await supabase
            .from('profesoria_sessions')
            .insert({
                username: session.username,
                session_type: session.session_type,
                scenario: session.scenario,
                duration_seconds: session.duration_seconds,
                xp_earned: session.xp_earned,
                score: session.score,
                details: session.details
            });

        if (error) throw error;
    } catch (error) {
        console.warn('Supabase saveSession failed, data saved to localStorage only:', error);
    }
};

/**
 * Get user session history
 */
export const getSessions = async (username: string, limit: number = 10): Promise<Session[]> => {
    try {
        const { data, error } = await supabase
            .from('profesoria_sessions')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.warn('Supabase getSessions failed, using localStorage:', error);
        return getSessionsFromLocalStorage(username, limit);
    }
};

// ============================================
// PRONUNCIATION MANAGEMENT
// ============================================

/**
 * Save pronunciation result
 */
export const savePronunciation = async (result: PronunciationResult): Promise<void> => {
    // Save to localStorage
    savePronunciationToLocalStorage(result);

    // Try to save to Supabase
    try {
        const { error } = await supabase
            .from('profesoria_pronunciation')
            .insert({
                username: result.username,
                phrase: result.phrase,
                score: result.score,
                word_analysis: result.word_analysis,
                feedback: result.feedback
            });

        if (error) throw error;
    } catch (error) {
        console.warn('Supabase savePronunciation failed, data saved to localStorage only:', error);
    }
};

/**
 * Get pronunciation history
 */
export const getPronunciations = async (username: string, limit: number = 10): Promise<PronunciationResult[]> => {
    try {
        const { data, error } = await supabase
            .from('profesoria_pronunciation')
            .select('*')
            .eq('username', username)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.warn('Supabase getPronunciations failed, using localStorage:', error);
        return getPronunciationsFromLocalStorage(username, limit);
    }
};

// ============================================
// LOCALSTORAGE FALLBACK
// ============================================

// ============================================
// LOCALSTORAGE FALLBACK
// ============================================

const PROFILE_PREFIX = 'profesoria_profile_';
const SESSIONS_PREFIX = 'profesoria_sessions_';
const PRONUNCIATION_PREFIX = 'profesoria_pronunciation_';

// Safe localStorage wrapper to prevent QuotaExceededError crashes
const safeSetItem = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (_e: unknown) {
        console.warn('LocalStorage Quota Exceeded or Error:', _e);
        // Optional: clear old sessions if quota exceeded?
        // For now, we just swallow the error to keep the app running.
    }
};

const safeGetItem = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch (_e) {
        return null;
    }
};

function getProfileFromLocalStorage(username: string): Profile | null {
    const stored = safeGetItem(PROFILE_PREFIX + username);
    return stored ? JSON.parse(stored) : null;
}

function saveProfileToLocalStorage(username: string, profile: Profile): void {
    safeSetItem(PROFILE_PREFIX + username, JSON.stringify(profile));
}

function saveSessionToLocalStorage(session: Session): void {
    const sessions = getSessionsFromLocalStorage(session.username, 100);
    sessions.unshift({ ...session, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    // Limit to 50 to prevent overflow
    if (sessions.length > 50) sessions.length = 50;
    safeSetItem(SESSIONS_PREFIX + session.username, JSON.stringify(sessions));
}

function getSessionsFromLocalStorage(username: string, limit: number): Session[] {
    const stored = safeGetItem(SESSIONS_PREFIX + username);
    const sessions: Session[] = stored ? JSON.parse(stored) : [];
    return sessions.slice(0, limit);
}

function savePronunciationToLocalStorage(result: PronunciationResult): void {
    const results = getPronunciationsFromLocalStorage(result.username, 100);
    results.unshift({ ...result, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    // Limit history
    if (results.length > 50) results.length = 50;
    safeSetItem(PRONUNCIATION_PREFIX + result.username, JSON.stringify(results));
}

function getPronunciationsFromLocalStorage(username: string, limit: number): PronunciationResult[] {
    const stored = safeGetItem(PRONUNCIATION_PREFIX + username);
    const results: PronunciationResult[] = stored ? JSON.parse(stored) : [];
    return results.slice(0, limit);
}

// ============================================
// ACADEMY MANAGEMENT
// ============================================

const SYLLABUS_PREFIX = 'profesoria_syllabus_';


export const saveSyllabus = async (username: string, syllabus: string[]): Promise<void> => {
    // 1. Local
    safeSetItem(SYLLABUS_PREFIX + username, JSON.stringify(syllabus));

    // 2. Cloud
    try {
        const { error: _error } = await supabase
            .from('profesoria_course_progress')
            .upsert({
                username,
                syllabus,
                last_updated: new Date().toISOString()
            }, { onConflict: 'username' });
    } catch (_e) {
        // Silent fail for offline mode
        // console.warn('Supabase saveSyllabus failed (Offline Mode)');
    }
};

export const getSyllabus = async (username: string): Promise<string[] | null> => {
    // 1. Try Cloud
    try {
        const { data } = await supabase
            .from('profesoria_course_progress')
            .select('syllabus')
            .eq('username', username)
            .maybeSingle();

        if (data?.syllabus && Array.isArray(data.syllabus) && data.syllabus.length > 0) {
            // Update cache
            safeSetItem(SYLLABUS_PREFIX + username, JSON.stringify(data.syllabus));
            return data.syllabus;
        }
    } catch (_e) {
        // Fallback
    }

    // 2. Fallback Local
    const stored = safeGetItem(SYLLABUS_PREFIX + username);
    return stored ? JSON.parse(stored) : null;
};

export const saveCourseProgress = async (progress: CourseProgress): Promise<void> => {
    // 1. Local
    safeSetItem('profesoria_course_' + progress.username, JSON.stringify(progress));

    // 2. Cloud
    try {
        const { error } = await supabase
            .from('profesoria_course_progress')
            .upsert({
                username: progress.username,
                completed_lessons: progress.completed_lessons,
                current_module_index: progress.current_module_index,
                last_updated: new Date().toISOString()
            }, { onConflict: 'username' });

        if (error) throw error;
    } catch (e) {
        console.warn('Supabase saveCourseProgress failed:', e);
    }
};

export const getCourseProgress = async (username: string): Promise<CourseProgress | null> => {
    // 1. Try Cloud
    try {
        const { data } = await supabase
            .from('profesoria_course_progress')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (data) {
            const courseProgress: CourseProgress = {
                username: data.username,
                syllabus: data.syllabus || [],
                completed_lessons: data.completed_lessons || [],
                current_module_index: data.current_module_index || 0
            };
            // Update cache
            safeSetItem('profesoria_course_' + username, JSON.stringify(courseProgress));
            return courseProgress;
        }
    } catch (_e) {
        // Fallback
    }

    // 2. Fallback Local
    const stored = safeGetItem('profesoria_course_' + username);
    return stored ? JSON.parse(stored) : null;
};

// ============================================
// UTILITIES
// ============================================

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
    const url = import.meta.env?.VITE_SUPABASE_URL;
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    return !!(url && key);
};

/**
 * HARD DELETE USER DATA
 */
export const deleteUserData = async (username: string): Promise<void> => {
    // 1. Delete from Supabase (Cascade usually handles relations, but let's be safe)
    try {
        await supabase.from('profesoria_profiles').delete().eq('username', username);
        await supabase.from('profesoria_sessions').delete().eq('username', username);
        await supabase.from('profesoria_pronunciation').delete().eq('username', username);
        await supabase.from('profesoria_course_progress').delete().eq('username', username);
        console.log('Supabase data deleted for:', username);
    } catch (e) {
        console.error('Supabase delete failed:', e);
    }

    // 2. Delete from LocalStorage
    localStorage.removeItem(PROFILE_PREFIX + username);
    localStorage.removeItem(SYLLABUS_PREFIX + username);
    localStorage.removeItem('profesoria_course_' + username);
    localStorage.removeItem(SESSIONS_PREFIX + username);
    localStorage.removeItem(PRONUNCIATION_PREFIX + username);

    // 3. Clear Session
    localStorage.removeItem('profesoria_current_user');
};
