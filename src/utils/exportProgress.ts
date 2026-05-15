// ─────────────────────────────────────────────────────────────────────────────
// Export Progress Utility — Profesoria English Mastery
// Generates and downloads a formatted text report of user progress.
// Zero external dependencies.
// ─────────────────────────────────────────────────────────────────────────────

import type { Profile } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's date in YYYY-MM-DD format. */
function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns a human-readable date string (e.g. "May 15, 2026"). */
function todayReadable(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Pads a string to a given width for aligned columns. */
function padRight(str: string, width: number): string {
  return str.length >= width ? str : str + ' '.repeat(width - str.length);
}

// ── Encouragement messages ───────────────────────────────────────────────────

const ENCOURAGEMENT_MESSAGES: Record<string, string> = {
  beginner: "Every expert was once a beginner. Keep going — you're building something great!",
  quarter: "You're making real progress! A quarter of the way there is no small feat.",
  halfway: "Halfway there! The foundation you've built will carry you the rest of the way.",
  almost: "Almost at the finish line! You've come too far to stop now.",
  complete: "Congratulations — you've completed the entire course! What an achievement!",
  fallback: "Keep up the great work! Consistency is the key to mastery.",
};

function encouragementMessage(completed: number, total: number): string {
  if (total === 0) return ENCOURAGEMENT_MESSAGES.fallback;
  const ratio = completed / total;
  if (ratio >= 1) return ENCOURAGEMENT_MESSAGES.complete;
  if (ratio >= 0.75) return ENCOURAGEMENT_MESSAGES.almost;
  if (ratio >= 0.5) return ENCOURAGEMENT_MESSAGES.halfway;
  if (ratio >= 0.25) return ENCOURAGEMENT_MESSAGES.quarter;
  return ENCOURAGEMENT_MESSAGES.beginner;
}

// ── Core export ───────────────────────────────────────────────────────────────

/**
 * Generates a formatted text progress report for the given profile and syllabus.
 *
 * @param profile           - The user profile containing name, level, XP, etc.
 * @param syllabus          - Full list of topic IDs in course order.
 * @param completedLessons  - Topic IDs the user has completed.
 * @returns A formatted plain-text string ready for download or display.
 */
export function exportProgress(
  profile: Profile,
  syllabus: string[],
  completedLessons: string[]
): string {
  const lines: string[] = [];
  const divider = '─'.repeat(60);
  const completedSet = new Set(completedLessons);
  const completedCount = completedLessons.length;
  const totalCount = syllabus.length;
  const percentage = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  // ── Header ──────────────────────────────────────────────────────────────
  lines.push(divider);
  lines.push('  Profesoria Progress Report');
  lines.push(`  Generated: ${todayReadable()}`);
  lines.push(divider);
  lines.push('');

  // ── User info ───────────────────────────────────────────────────────────
  lines.push('  USER INFORMATION');
  lines.push(divider);
  lines.push(`  ${padRight('Name', 20)} ${profile.name || profile.username || 'N/A'}`);
  lines.push(`  ${padRight('Current Level', 20)} ${profile.current_level || 'N/A'}`);
  lines.push(`  ${padRight('Target Level', 20)} ${profile.target_level || 'N/A'}`);
  lines.push(`  ${padRight('Total XP', 20)} ${profile.xp_total ?? 0}`);
  lines.push(`  ${padRight('Streak', 20)} ${profile.streak_count ?? 0} day${profile.streak_count === 1 ? '' : 's'}`);
  lines.push(`  ${padRight('Daily XP', 20)} ${profile.daily_xp ?? 0}`);

  if (profile.daily_goal) {
    lines.push(`  ${padRight('Daily Goal', 20)} ${profile.daily_goal} XP`);
  }

  if (profile.last_practice_at) {
    const lastDate = new Date(profile.last_practice_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    lines.push(`  ${padRight('Last Practice', 20)} ${lastDate}`);
  }

  lines.push('');

  // ── Course progress ─────────────────────────────────────────────────────
  lines.push('  COURSE PROGRESS');
  lines.push(divider);
  lines.push(`  Topics completed:   ${completedCount} / ${totalCount}`);
  lines.push(`  Progress:           ${percentage}%`);
  lines.push(`  ${buildProgressBar(percentage, 40)}`);
  lines.push('');

  // ── Completed topics ────────────────────────────────────────────────────
  lines.push('  COMPLETED TOPICS');
  lines.push(divider);

  if (completedCount === 0) {
    lines.push('  (no topics completed yet)');
  } else {
    const completedInOrder = syllabus.filter((id) => completedSet.has(id));
    // Include any completed topics not found in the syllabus at the end
    const extras = completedLessons.filter((id) => !syllabus.includes(id));
    const allCompleted = [...completedInOrder, ...extras];

    allCompleted.forEach((topic, i) => {
      lines.push(`  ${String(i + 1).padStart(3)}. ✓ ${topic}`);
    });
  }
  lines.push('');

  // ── Remaining topics ───────────────────────────────────────────────────
  const remainingTopics = syllabus.filter((id) => !completedSet.has(id));

  lines.push('  REMAINING TOPICS');
  lines.push(divider);

  if (remainingTopics.length === 0) {
    lines.push('  (all topics completed!)');
  } else {
    remainingTopics.forEach((topic, i) => {
      lines.push(`  ${String(i + 1).padStart(3)}. ○ ${topic}`);
    });
  }
  lines.push('');

  // ── Footer ──────────────────────────────────────────────────────────────
  lines.push(divider);
  lines.push(`  ${encouragementMessage(completedCount, totalCount)}`);
  lines.push(divider);
  lines.push('');

  return lines.join('\n');
}

// ── Progress bar ─────────────────────────────────────────────────────────────

/** Builds a text-based progress bar. e.g. [========-------------] 50% */
function buildProgressBar(percentage: number, width: number): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(Math.max(filled, 0)) + '░'.repeat(Math.max(empty, 0));
  return `[${bar}] ${percentage}%`;
}

// ── Download trigger ─────────────────────────────────────────────────────────

/**
 * Generates a progress report and triggers a browser download of the .txt file.
 *
 * Uses the Blob + object URL pattern for broad browser compatibility,
 * including PWA and mobile Safari environments.
 *
 * @param profile           - The user profile containing name, level, XP, etc.
 * @param syllabus          - Full list of topic IDs in course order.
 * @param completedLessons  - Topic IDs the user has completed.
 */
export function downloadProgressReport(
  profile: Profile,
  syllabus: string[],
  completedLessons: string[]
): void {
  const content = exportProgress(profile, syllabus, completedLessons);
  const fileName = `profesoria-progress-${todayISO()}.txt`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Clean up after a short delay to ensure the download initiates
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}