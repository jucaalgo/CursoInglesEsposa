// Spaced Repetition Service — Profesoria English Mastery
// SM-2 algorithm (SuperMemo 2) for optimal review scheduling
// Integrates with the existing errorJournal to convert mistakes into review items

import { getErrors, type ErrorEntry, type ErrorCategory } from './errorJournal';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SRSItemType = 'vocabulary' | 'grammar' | 'pronunciation';

export interface SRSItem {
  id: string;
  type: SRSItemType;
  content: string;           // The word/phrase/rule to review
  translation?: string;      // Spanish translation
  explanation?: string;      // Why it matters / context
  level: number;             // Easiness factor (1.3–3.0, default 2.5)
  interval: number;          // Days until next review
  repetitions: number;       // Number of successful consecutive reviews
  nextReview: string;         // ISO date of next review
  lastReview: string | null;  // ISO date of last review
  createdAt: string;          // ISO date
}

export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = complete blackout
// 1 = wrong but recognized after seeing the answer
// 2 = wrong but the answer seemed easy to recall
// 3 = correct with serious difficulty
// 4 = correct with hesitation
// 5 = perfect recall

export interface SRSStats {
  totalItems: number;
  dueToday: number;
  mastered: number;    // items with interval >= 21 days
  learning: number;    // items with interval 1–20 days
  newItems: number;    // items with 0 repetitions
  averageEasiness: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'profesoria_srs_';
const MAX_ITEMS = 500;
const DEFAULT_EASINESS = 2.5;
const MIN_EASINESS = 1.3;

// ─── Safe localStorage helpers (matches project pattern) ──────────────────────

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
    evictOldestItems(key, value);
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

function evictOldestItems(newKey: string, newValue: string): void {
  // Remove expired items first, then oldest 20% of SRS entries
  purgeExpired();

  const entries: { key: string; timestamp: number } = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX) && key !== newKey) {
      const raw = safeGet(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          entries.push({ key, timestamp: parsed.createdAt ? new Date(parsed.createdAt).getTime() : 0 });
        } catch {
          entries.push({ key, timestamp: 0 });
        }
      }
    }
  }

  entries.sort((a, b) => a.timestamp - b.timestamp);
  const toRemove = Math.max(1, Math.floor(entries.length * 0.2));
  for (let i = 0; i < toRemove; i++) {
    localStorage.removeItem(entries[i].key);
  }

  // Try writing again
  try {
    localStorage.setItem(newKey, newValue);
  } catch {
    // Give up — localStorage truly full
  }
}

// ─── Storage operations ───────────────────────────────────────────────────────

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function readItems(userId: string): SRSItem[] {
  try {
    const raw = safeGet(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeItems(userId: string, items: SRSItem[]): void {
  // Enforce MAX_ITEMS cap — keep newest
  const trimmed = items.length > MAX_ITEMS
    ? items
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, MAX_ITEMS)
    : items;
  safeSet(storageKey(userId), JSON.stringify(trimmed));
}

// ─── SM-2 Algorithm ───────────────────────────────────────────────────────────

/**
 * Calculate the next review schedule for an item using the SM-2 algorithm.
 *
 * Algorithm rules:
 *   grade < 3  → reset: repetitions = 0, interval = 1
 *   grade >= 3 & repetitions == 0 → interval = 1 day
 *   grade >= 3 & repetitions == 1 → interval = 6 days
 *   grade >= 3 & repetitions >= 2 → interval = round(interval * level)
 *   easiness adjustment: level = max(1.3, level + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
 */
export function calculateNextReview(item: SRSItem, grade: SRSGrade): SRSItem {
  const now = new Date();
  let { level, interval, repetitions } = item;

  if (grade < 3) {
    // Failed recall — reset progress
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall — advance
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * level);
    }
    repetitions += 1;
  }

  // Adjust easiness factor
  level = level + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  level = Math.max(MIN_EASINESS, level);

  const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    ...item,
    level,
    interval,
    repetitions,
    nextReview: nextReviewDate.toISOString(),
    lastReview: now.toISOString(),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add a new item to the SRS system.
 * Starts with default easiness 2.5, interval 0, and nextReview = now (due immediately).
 */
export function addItem(
  userId: string,
  item: Omit<SRSItem, 'id' | 'level' | 'interval' | 'repetitions' | 'nextReview' | 'lastReview' | 'createdAt'>,
): SRSItem {
  const items = readItems(userId);

  // Deduplicate: skip if identical content+type already exists
  const existing = items.find(i => i.content === item.content && i.type === item.type);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const fullItem: SRSItem = {
    ...item,
    id: `srs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    level: DEFAULT_EASINESS,
    interval: 0,
    repetitions: 0,
    nextReview: now, // Due immediately
    lastReview: null,
    createdAt: now,
  };

  items.push(fullItem);
  writeItems(userId, items);
  return fullItem;
}

/**
 * Review an item and update its schedule based on the grade given.
 * Returns the updated item.
 */
export function reviewItem(userId: string, itemId: string, grade: SRSGrade): SRSItem | null {
  const items = readItems(userId);
  const idx = items.findIndex(i => i.id === itemId);
  if (idx === -1) return null;

  const updated = calculateNextReview(items[idx], grade);
  items[idx] = updated;
  writeItems(userId, items);
  return updated;
}

/**
 * Get all items due for review today (or earlier).
 */
export function getDueItems(userId: string): SRSItem[] {
  const items = readItems(userId);
  const now = new Date();
  return items
    .filter(item => new Date(item.nextReview) <= now)
    .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
}

/**
 * Get all items in the SRS, sorted by next review date.
 */
export function getAllItems(userId: string): SRSItem[] {
  const items = readItems(userId);
  return items.sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
}

/**
 * Get a single item by ID.
 */
export function getItem(userId: string, itemId: string): SRSItem | null {
  const items = readItems(userId);
  return items.find(i => i.id === itemId) || null;
}

/**
 * Remove an item from the SRS.
 */
export function removeItem(userId: string, itemId: string): boolean {
  const items = readItems(userId);
  const filtered = items.filter(i => i.id !== itemId);
  if (filtered.length === items.length) return false;
  writeItems(userId, filtered);
  return true;
}

/**
 * Compute statistics for the user's SRS deck.
 */
export function getSRSStats(userId: string): SRSStats {
  const items = readItems(userId);
  const now = new Date();

  const dueToday = items.filter(item => new Date(item.nextReview) <= now).length;
  const mastered = items.filter(item => item.interval >= 21).length;
  const learning = items.filter(item => item.interval >= 1 && item.interval < 21).length;
  const newItems = items.filter(item => item.repetitions === 0).length;
  const averageEasiness = items.length > 0
    ? items.reduce((sum, item) => sum + item.level, 0) / items.length
    : DEFAULT_EASINESS;

  return {
    totalItems: items.length,
    dueToday,
    mastered,
    learning,
    newItems,
    averageEasiness: Math.round(averageEasiness * 100) / 100,
  };
}

// ─── Error Journal Integration ────────────────────────────────────────────────

/**
 * Map ErrorCategory from errorJournal to SRSItemType.
 */
function errorCategoryToSRSType(category: ErrorCategory): SRSItemType {
  switch (category) {
    case 'grammar':
    case 'spelling':
      return 'grammar';
    case 'vocabulary':
      return 'vocabulary';
    case 'pronunciation':
      return 'pronunciation';
    default:
      return 'grammar';
  }
}

/**
 * Convert error journal entries into SRS review items.
 * Only includes unmastered errors that are not already in the SRS deck.
 * Returns the newly created SRS items.
 */
export function generateReviewFromErrors(
  userId: string,
  errors: Array<{ original: string; correction: string; explanation: string }>,
  level: string,
): SRSItem[] {
  const existingItems = readItems(userId);
  const created: SRSItem[] = [];

  for (const error of errors) {
    // Deduplicate against both existing SRS items and already-queued items in this batch
    const content = `${error.original} → ${error.correction}`;
    const alreadyExists = existingItems.some(i => i.content === content) ||
      created.some(i => i.content === content);
    if (alreadyExists) continue;

    // Detect category from the explanation text
    const detectedCategory = detectSRSTypeFromExplanation(error.explanation);

    const item = addItem(userId, {
      type: detectedCategory,
      content,
      translation: error.correction,
      explanation: error.explanation,
    });

    created.push(item);
    existingItems.push(item); // Keep local copy in sync for dedup
  }

  return created;
}

/**
 * Import all unmastered errors from the error journal into the SRS.
 * Bridges the errorJournal service with the spaced repetition system.
 */
export function importErrorsFromJournal(userId: string): SRSItem[] {
  const errors = getErrors(userId);
  const unmastered = errors.filter(e => !e.mastered);

  return generateReviewFromErrors(
    userId,
    unmastered.map(e => ({
      original: e.original,
      correction: e.correction,
      explanation: e.explanation,
    })),
    '', // level not needed for SRS type detection
  );
}

// ─── Category Detection ──────────────────────────────────────────────────────

/**
 * Detect the SRS item type from the explanation text.
 * Uses the same keyword strategy as errorJournal.detectCategory.
 */
const SRS_TYPE_KEYWORDS: Record<SRSItemType, string[]> = {
  vocabulary: [
    'word', 'vocabulary', 'term', 'expression', 'phrase', 'idiom',
    'collocation', 'synonym', 'antonym', 'meaning', 'usage', 'lexical',
  ],
  grammar: [
    'tense', 'verb', 'conjugation', 'subject', 'agreement', 'clause',
    'sentence structure', 'word order', 'auxiliary', 'modal', 'conditional',
    'subjunctive', 'passive', 'active', 'participle', 'gerund', 'infinitive',
    'preposition', 'conjunction', 'article', 'determiner', 'plural', 'singular',
    'comparative', 'superlative', 'pronoun', 'relative clause', 'syntax',
    'spelling', 'spelled', 'spell', 'misspell', 'typo', 'letter',
    'capitalization', 'capitalize', 'punctuation', 'apostrophe',
  ],
  pronunciation: [
    'pronunciation', 'pronounce', 'sound', 'phoneme', 'stress', 'intonation',
    'accent', 'syllable', 'vowel', 'consonant', 'rhythm', 'tone', 'articulation',
  ],
};

function detectSRSTypeFromExplanation(explanation: string): SRSItemType {
  const lower = explanation.toLowerCase();
  let best: SRSItemType = 'grammar';
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(SRS_TYPE_KEYWORDS) as [SRSItemType, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }
  return best;
}

// ─── Bulk Operations ──────────────────────────────────────────────────────────

/**
 * Review multiple items at once. Returns updated items in the same order.
 * Items not found are returned as null.
 */
export function reviewItems(
  userId: string,
  reviews: Array<{ itemId: string; grade: SRSGrade }>,
): (SRSItem | null)[] {
  const items = readItems(userId);
  const results: (SRSItem | null)[] = [];

  for (const { itemId, grade } of reviews) {
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) {
      results.push(null);
      continue;
    }
    items[idx] = calculateNextReview(items[idx], grade);
    results.push(items[idx]);
  }

  writeItems(userId, items);
  return results;
}

/**
 * Get items grouped by type.
 */
export function getItemsByType(userId: string, type: SRSItemType): SRSItem[] {
  const items = readItems(userId);
  return items.filter(i => i.type === type);
}

/**
 * Get items that are considered "mastered" (interval >= 21 days).
 */
export function getMasteredItems(userId: string): SRSItem[] {
  return readItems(userId).filter(i => i.interval >= 21);
}

/**
 * Get items currently in the learning phase (interval 1–20 days).
 */
export function getLearningItems(userId: string): SRSItem[] {
  return readItems(userId).filter(i => i.interval >= 1 && i.interval < 21);
}

/**
 * Get brand-new items (never reviewed, repetitions == 0).
 */
export function getNewItems(userId: string): SRSItem[] {
  return readItems(userId).filter(i => i.repetitions === 0);
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

/**
 * Remove all expired items (nextReview more than 365 days in the past with high easiness).
 * Prevents the deck from accumulating abandoned items.
 */
export function purgeExpired(): number {
  let removed = 0;
  const keysToRemove: string[] = [];
  const ninetyDaysAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const raw = safeGet(key);
      if (raw) {
        try {
          const items: SRSItem[] = JSON.parse(raw);
          // Filter out items overdue by more than a year (likely abandoned)
          const filtered = items.filter(item => {
            const overdue = new Date(item.nextReview).getTime();
            if (overdue < ninetyDaysAgo && item.level > 2.8) {
              removed++;
              return false;
            }
            return true;
          });
          if (filtered.length !== items.length) {
            safeSet(key, JSON.stringify(filtered));
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

/**
 * Clear all SRS data for a user (used during account deletion).
 */
export function clearSRSData(userId: string): void {
  localStorage.removeItem(storageKey(userId));
}

/**
 * Export the SRS deck as a human-readable string (for sharing/backup).
 */
export function exportDeck(userId: string): string {
  const items = readItems(userId);
  const stats = getSRSStats(userId);

  if (items.length === 0) return 'No review items yet.';

  const header = [
    '═══ PROFESORIA SPACED REPETITION DECK ═══',
    `Total: ${stats.totalItems} | Due: ${stats.dueToday} | Mastered: ${stats.mastered} | Learning: ${stats.learning} | New: ${stats.newItems}`,
    `Average Easiness: ${stats.averageEasiness}`,
    '───────────────────────────────────────────',
  ].join('\n');

  const lines = items.map((item, i) => {
    const due = new Date(item.nextReview).toLocaleDateString();
    const status = item.repetitions === 0 ? '[NEW]'
      : item.interval >= 21 ? '[MASTERED]'
      : `[LEARNING]`;
    return [
      `#${i + 1} ${status} (${item.type}) Due: ${due}`,
      `  Content:      ${item.content}`,
      item.translation ? `  Translation:  ${item.translation}` : '',
      item.explanation ? `  Explanation:  ${item.explanation}` : '',
      `  Reps: ${item.repetitions} | Interval: ${item.interval}d | Easiness: ${item.level.toFixed(2)}`,
    ].filter(Boolean).join('\n');
  });

  return `${header}\n\n${lines.join('\n\n')}`;
}