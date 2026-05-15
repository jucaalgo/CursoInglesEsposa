// Error Journal Service — Profesoria English Mastery
// Stores, retrieves, and analyzes student mistakes for spaced review

const STORAGE_PREFIX = 'profesoria_errors_';
const MAX_ENTRIES = 200;

export type ErrorCategory = 'grammar' | 'vocabulary' | 'pronunciation' | 'spelling';

export interface ErrorEntry {
    id: string;
    original: string;
    correction: string;
    explanation: string;
    category: ErrorCategory;
    level: string;
    timestamp: string;
    reviewCount: number;
    lastReviewed: string | null;
    mastered: boolean;
}

export interface ErrorStats {
    total: number;
    mastered: number;
    unmastered: number;
    byCategory: Record<ErrorCategory, number>;
    mostCommonPatterns: { pattern: string; count: number }[];
}

// ─── Category auto-detection ────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<ErrorCategory, string[]> = {
    grammar: [
        'tense', 'verb', 'conjugation', 'subject', 'agreement', 'clause',
        'sentence structure', 'word order', 'auxiliary', 'modal', 'conditional',
        'subjunctive', 'passive', 'active', 'participle', 'gerund', 'infinitive',
        'preposition', 'conjunction', 'article', 'determiner', 'plural', 'singular',
        'comparative', 'superlative', 'pronoun', 'relative clause', 'syntax',
    ],
    vocabulary: [
        'word', 'vocabulary', 'term', 'expression', 'phrase', 'idiom',
        'collocation', 'synonym', 'antonym', 'meaning', 'usage', 'lexical',
        'choose the right word', 'wrong word', 'better word',
    ],
    pronunciation: [
        'pronunciation', 'pronounce', 'sound', 'phoneme', 'stress', 'intonation',
        'accent', 'syllable', 'vowel', 'consonant', 'rhythm', 'tone', 'articulation',
    ],
    spelling: [
        'spelling', 'spelled', 'spell', 'misspell', 'typo', 'letter',
        'capitalization', 'capitalize', 'punctuation mark', 'apostrophe',
    ],
};

export function detectCategory(explanation: string): ErrorCategory {
    const lower = explanation.toLowerCase();
    let best: ErrorCategory = 'grammar';
    let bestScore = 0;

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ErrorCategory, string[]][]) {
        let score = 0;
        for (const kw of keywords) {
            if (lower.includes(kw)) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            best = cat;
        }
    }
    return best;
}

// ─── Storage helpers ────────────────────────────────────────────────────────

function storageKey(username: string): string {
    return `${STORAGE_PREFIX}${username}`;
}

function readEntries(username: string): ErrorEntry[] {
    try {
        const raw = localStorage.getItem(storageKey(username));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeEntries(username: string, entries: ErrorEntry[]): void {
    // FIFO: keep only the newest MAX_ENTRIES
    const trimmed = entries.length > MAX_ENTRIES
        ? entries.slice(entries.length - MAX_ENTRIES)
        : entries;
    localStorage.setItem(storageKey(username), JSON.stringify(trimmed));
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function addError(
    username: string,
    entry: Omit<ErrorEntry, 'id' | 'timestamp' | 'reviewCount' | 'lastReviewed' | 'mastered' | 'category'> & { category?: ErrorCategory },
): ErrorEntry {
    const entries = readEntries(username);

    // Deduplicate: skip if identical original+correction already stored and not mastered
    const exists = entries.some(
        e => e.original === entry.original && e.correction === entry.correction && !e.mastered,
    );
    if (exists) {
        return entries.find(e => e.original === entry.original && e.correction === entry.correction)!;
    }

    const fullEntry: ErrorEntry = {
        ...entry,
        id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        category: entry.category || detectCategory(entry.explanation),
        timestamp: new Date().toISOString(),
        reviewCount: 0,
        lastReviewed: null,
        mastered: false,
    };

    entries.push(fullEntry);
    writeEntries(username, entries);
    return fullEntry;
}

export function getErrors(username: string): ErrorEntry[] {
    return readEntries(username).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
}

export function getErrorsByCategory(username: string, category: ErrorCategory): ErrorEntry[] {
    return getErrors(username).filter(e => e.category === category);
}

export function getUnmasteredErrors(username: string): ErrorEntry[] {
    return getErrors(username).filter(e => !e.mastered);
}

export function markAsMastered(username: string, id: string): boolean {
    const entries = readEntries(username);
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) return false;
    entries[idx].mastered = true;
    writeEntries(username, entries);
    return true;
}

export function incrementReview(username: string, id: string): boolean {
    const entries = readEntries(username);
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) return false;
    entries[idx].reviewCount += 1;
    entries[idx].lastReviewed = new Date().toISOString();
    writeEntries(username, entries);
    return true;
}

export function deleteError(username: string, id: string): boolean {
    const entries = readEntries(username);
    const filtered = entries.filter(e => e.id !== id);
    if (filtered.length === entries.length) return false;
    writeEntries(username, filtered);
    return true;
}

export function getErrorStats(username: string): ErrorStats {
    const entries = readEntries(username);

    const byCategory: Record<ErrorCategory, number> = {
        grammar: 0,
        vocabulary: 0,
        pronunciation: 0,
        spelling: 0,
    };

    // Pattern frequency map (lowercased original)
    const patternMap = new Map<string, number>();

    for (const e of entries) {
        byCategory[e.category] = (byCategory[e.category] || 0) + 1;
        const key = e.original.toLowerCase().trim();
        patternMap.set(key, (patternMap.get(key) || 0) + 1);
    }

    const mastered = entries.filter(e => e.mastered).length;

    // Top 5 most common patterns
    const mostCommonPatterns = Array.from(patternMap.entries())
        .map(([pattern, count]) => ({ pattern, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        total: entries.length,
        mastered,
        unmastered: entries.length - mastered,
        byCategory,
        mostCommonPatterns,
    };
}

export function exportJournal(username: string): string {
    const entries = getErrors(username);
    if (entries.length === 0) return 'No errors recorded yet.';

    const lines = entries.map((e, i) => {
        const date = new Date(e.timestamp).toLocaleDateString();
        const status = e.mastered ? '[MASTERED]' : '[ACTIVE]';
        return [
            `#${i + 1} ${status} (${e.category}) ${date}`,
            `  Original:    ${e.original}`,
            `  Correction:  ${e.correction}`,
            `  Explanation: ${e.explanation}`,
            `  Reviews: ${e.reviewCount}`,
        ].join('\n');
    });

    const stats = getErrorStats(username);
    const header = [
        '═══ PROFESORIA ERROR JOURNAL ═══',
        `Total: ${stats.total} | Mastered: ${stats.mastered} | Active: ${stats.unmastered}`,
        `Grammar: ${stats.byCategory.grammar} | Vocab: ${stats.byCategory.vocabulary} | Pronunciation: ${stats.byCategory.pronunciation} | Spelling: ${stats.byCategory.spelling}`,
        '─────────────────────────────────',
    ].join('\n');

    return `${header}\n\n${lines.join('\n\n')}`;
}