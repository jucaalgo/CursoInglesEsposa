import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================
export interface Profile {
    username: string;
    name: string;
    current_level: string;
    target_level: string;
    interests: string[];
    xp_total: number;
    streak_count: number;
    last_practice_at?: string;
}

export interface Session {
    id?: string;
    username: string;
    session_type: 'call' | 'vocab' | 'pronunciation' | 'roleplay';
    scenario?: string;
    duration_seconds: number;
    xp_earned: number;
    score?: number;
    details?: any;
    created_at?: string;
}

export interface PronunciationResult {
    id?: string;
    username: string;
    phrase: string;
    score: number;
    word_analysis?: any;
    feedback: string;
    created_at?: string;
}

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
            .eq('username', username)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found in Supabase, check localStorage
                return getProfileFromLocalStorage(username);
            }
            throw error;
        }

        // Save to localStorage as cache
        saveProfileToLocalStorage(username, data);
        return data;
    } catch (error) {
        console.warn('Supabase getProfile failed, using localStorage:', error);
        return getProfileFromLocalStorage(username);
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
        last_practice_at: profile.last_practice_at
    };

    // Save to localStorage first (always succeeds)
    saveProfileToLocalStorage(username, fullProfile);

    // Try to save to Supabase
    try {
        const { error } = await supabase
            .from('profesoria_profiles')
            .upsert(fullProfile, { onConflict: 'username' });

        if (error) throw error;
    } catch (error) {
        console.warn('Supabase saveProfile failed, data saved to localStorage only:', error);
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

    await saveProfile(username, {
        ...profile,
        xp_total: profile.xp_total + xpEarned,
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

const PROFILE_PREFIX = 'profesoria_profile_';
const SESSIONS_PREFIX = 'profesoria_sessions_';
const PRONUNCIATION_PREFIX = 'profesoria_pronunciation_';

function getProfileFromLocalStorage(username: string): Profile | null {
    const stored = localStorage.getItem(PROFILE_PREFIX + username);
    return stored ? JSON.parse(stored) : null;
}

function saveProfileToLocalStorage(username: string, profile: Profile): void {
    localStorage.setItem(PROFILE_PREFIX + username, JSON.stringify(profile));
}

function saveSessionToLocalStorage(session: Session): void {
    const sessions = getSessionsFromLocalStorage(session.username, 100);
    sessions.unshift({ ...session, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    localStorage.setItem(SESSIONS_PREFIX + session.username, JSON.stringify(sessions));
}

function getSessionsFromLocalStorage(username: string, limit: number): Session[] {
    const stored = localStorage.getItem(SESSIONS_PREFIX + username);
    const sessions: Session[] = stored ? JSON.parse(stored) : [];
    return sessions.slice(0, limit);
}

function savePronunciationToLocalStorage(result: PronunciationResult): void {
    const results = getPronunciationsFromLocalStorage(result.username, 100);
    results.unshift({ ...result, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    localStorage.setItem(PRONUNCIATION_PREFIX + result.username, JSON.stringify(results));
}

function getPronunciationsFromLocalStorage(username: string, limit: number): PronunciationResult[] {
    const stored = localStorage.getItem(PRONUNCIATION_PREFIX + username);
    const results: PronunciationResult[] = stored ? JSON.parse(stored) : [];
    return results.slice(0, limit);
}

// ============================================
// UTILITIES
// ============================================

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
    // @ts-ignore
    const url = import.meta.env?.VITE_SUPABASE_URL;
    // @ts-ignore
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    return !!(url && key);
};
