// Content and TTS caching layer with TTL-based expiration
// Uses localStorage for simplicity with automatic cleanup

const CACHE_PREFIX = 'profesoria_cache_';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours for lesson content
const TTS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days for TTS audio (larger, rarely changes)

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

function safeGet(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function safeSet(key: string, value: string): boolean {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        // localStorage quota exceeded - evict old entries
        evictOldestEntries();
        try {
            localStorage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    }
}

function evictOldestEntries(): void {
    const entries: { key: string; timestamp: number } = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            const raw = safeGet(key);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    entries.push({ key, timestamp: parsed.timestamp || 0 });
                } catch {
                    entries.push({ key, timestamp: 0 });
                }
            }
        }
    }
    // Remove oldest 20% of entries
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = Math.max(1, Math.floor(entries.length * 0.2));
    for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entries[i].key);
    }
}

// Public cache API

export function cacheLessonContent(topic: string, level: string, data: unknown): boolean {
    const key = `${CACHE_PREFIX}lesson_${level}_${topic}`;
    const entry: CacheEntry<unknown> = { data, timestamp: Date.now(), ttl: DEFAULT_TTL };
    return safeSet(key, JSON.stringify(entry));
}

export function getCachedLessonContent(topic: string, level: string): unknown | null {
    const key = `${CACHE_PREFIX}lesson_${level}_${topic}`;
    const raw = safeGet(key);
    if (!raw) return null;
    try {
        const entry: CacheEntry<unknown> = JSON.parse(raw);
        if (Date.now() - entry.timestamp > entry.ttl) {
            localStorage.removeItem(key);
            return null;
        }
        return entry.data;
    } catch {
        localStorage.removeItem(key);
        return null;
    }
}

export function cacheTTSAudio(text: string, audioBase64: string): boolean {
    // Hash the text for the cache key
    const hash = hashString(text);
    const key = `${CACHE_PREFIX}tts_${hash}`;
    const entry: CacheEntry<string> = { data: audioBase64, timestamp: Date.now(), ttl: TTS_TTL };
    return safeSet(key, JSON.stringify(entry));
}

export function getCachedTTSAudio(text: string): string | null {
    const hash = hashString(text);
    const key = `${CACHE_PREFIX}tts_${hash}`;
    const raw = safeGet(key);
    if (!raw) return null;
    try {
        const entry: CacheEntry<string> = JSON.parse(raw);
        if (Date.now() - entry.timestamp > entry.ttl) {
            localStorage.removeItem(key);
            return null;
        }
        return entry.data;
    } catch {
        localStorage.removeItem(key);
        return null;
    }
}

// Simple string hash (djb2)
function hashString(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

// Clean up all expired cache entries
export function cleanExpiredCache(): number {
    let removed = 0;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            const raw = safeGet(key);
            if (raw) {
                try {
                    const entry = JSON.parse(raw);
                    if (Date.now() - entry.timestamp > entry.ttl) {
                        keysToRemove.push(key);
                    }
                } catch {
                    keysToRemove.push(key);
                }
            }
        }
    }
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        removed++;
    });
    return removed;
}

// Get cache statistics
export function getCacheStats(): { entries: number; sizeKB: number } {
    let entries = 0;
    let sizeBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            entries++;
            const raw = safeGet(key);
            if (raw) sizeBytes += raw.length * 2; // UTF-16
        }
    }
    return { entries, sizeKB: Math.round(sizeBytes / 1024) };
}

// Run cleanup on module load
cleanExpiredCache();