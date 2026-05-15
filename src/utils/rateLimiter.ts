// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiter Utility — Profesoria English Mastery
// Debounce, throttle, retry with backoff, and per-key rate limiting.
// Zero external dependencies.
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────────────────────

interface RateLimiterEntry {
  timestamps: number[];
  lastCallTime: number;
}

interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterMs: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterMs: 200,
  retryableStatusCodes: [429, 503],
};

// ── Debounce ─────────────────────────────────────────────────────────────────

/**
 * Prevents rapid successive calls. Only the last call within `delayMs` is
 * executed. Useful for chat messages, search inputs, and other user-driven
 * actions that should not fire on every keystroke.
 *
 * @param fn       - The function to debounce
 * @param delayMs  - Minimum milliseconds between invocations
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: any[] | null = null;

  const debounced = function (this: unknown, ...args: any[]) {
    lastArgs = args;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      const currentArgs = lastArgs;
      lastArgs = null;
      if (currentArgs !== null) {
        fn.apply(this, currentArgs);
      }
    }, delayMs);
  } as T & { cancel: () => void; flush: () => void };

  /** Cancel any pending debounced call. */
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  /** Immediately invoke the pending call if one exists, cancelling the timer. */
  debounced.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      const currentArgs = lastArgs;
      lastArgs = null;
      if (currentArgs !== null) {
        fn(...currentArgs);
      }
    }
  };

  return debounced;
}

// ── Throttle ─────────────────────────────────────────────────────────────────

/**
 * Limits the number of calls within a sliding time window. At most `maxCalls`
 * invocations are allowed within every `limitMs` window. Excess calls are
 * silently dropped (not queued).
 *
 * @param fn       - The function to throttle
 * @param limitMs  - Size of the sliding time window in milliseconds
 * @param maxCalls - Maximum invocations allowed per window
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limitMs: number,
  maxCalls: number
): T & { cancel: () => void } {
  const callTimestamps: number[] = [];

  const throttled = function (this: unknown, ...args: any[]) {
    const now = Date.now();
    const windowStart = now - limitMs;

    // Prune timestamps outside the current window
    while (callTimestamps.length > 0 && callTimestamps[0] <= windowStart) {
      callTimestamps.shift();
    }

    if (callTimestamps.length < maxCalls) {
      callTimestamps.push(now);
      return fn.apply(this, args);
    }

    // Call was throttled — return undefined silently
    return undefined;
  } as T & { cancel: () => void };

  /** Reset the throttle, clearing all recorded timestamps. */
  throttled.cancel = () => {
    callTimestamps.length = 0;
  };

  return throttled;
}

// ── Retry with Exponential Backoff ────────────────────────────────────────────

/**
 * Retries an async function with exponential backoff when it throws errors that
 * include a `status` property matching a retryable HTTP status code (default
 * 429 and 503). Also retries on network-like errors whose message contains
 * "rate" or "quota".
 *
 * @param fn          - Async function to execute
 * @param maxRetries  - Maximum number of retry attempts (default 3)
 * @param baseDelayMs - Base delay in ms; doubles each retry (default 1000)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = DEFAULT_RETRY_OPTIONS.maxRetries,
  baseDelayMs: number = DEFAULT_RETRY_OPTIONS.baseDelayMs
): Promise<T> {
  const opts = DEFAULT_RETRY_OPTIONS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // Never retry on the last allowed attempt
      if (attempt >= maxRetries) {
        break;
      }

      const isRetryable = isRetryableError(error, opts.retryableStatusCodes);
      if (!isRetryable) {
        throw error;
      }

      // Calculate backoff: exponential with jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.floor(Math.random() * opts.jitterMs);
      const delay = Math.min(exponentialDelay + jitter, opts.maxDelayMs);

      console.warn(
        `[RateLimiter] Retry ${attempt + 1}/${maxRetries} after ${delay}ms —`,
        errorSummary(error)
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

// ── Per-Key Rate Limiter ─────────────────────────────────────────────────────

/**
 * Creates a rate limiter that tracks calls per key (user, endpoint, etc.).
 * Enforces both a minimum interval between calls AND a maximum number of calls
 * per minute.
 *
 * @example
 * ```ts
 * const geminiLimiter = createRateLimiter({
 *   minIntervalMs: 2000,   // 2 s between calls
 *   maxCallsPerMinute: 10, // max 10 calls per minute
 * });
 *
 * // Per-user rate limiting
 * const userLimiter = createRateLimiter({ minIntervalMs: 2000, maxCallsPerMinute: 10 });
 * await userLimiter.execute(() => callGemini(userPrompt), { key: userId });
 * ```
 */
export function createRateLimiter(config: {
  minIntervalMs: number;
  maxCallsPerMinute: number;
}): {
  execute: <T>(fn: () => Promise<T>, options?: { key?: string }) => Promise<T>;
  getWaitTime: (key?: string) => number;
  reset: (key?: string) => void;
  resetAll: () => void;
} {
  const entries = new Map<string, RateLimiterEntry>();
  const WINDOW_MS = 60_000; // 1-minute sliding window

  function getEntry(key: string): RateLimiterEntry {
    let entry = entries.get(key);
    if (!entry) {
      entry = { timestamps: [], lastCallTime: 0 };
      entries.set(key, entry);
    }
    return entry;
  }

  function pruneOldTimestamps(entry: RateLimiterEntry): void {
    const cutoff = Date.now() - WINDOW_MS;
    while (entry.timestamps.length > 0 && entry.timestamps[0] <= cutoff) {
      entry.timestamps.shift();
    }
  }

  /**
   * Returns how many milliseconds the caller must wait before the next call
   * is allowed for the given key. Returns 0 if the call can proceed immediately.
   */
  function getWaitTime(key: string = "_default"): number {
    const now = Date.now();
    const entry = getEntry(key);
    pruneOldTimestamps(entry);

    // Check minimum interval constraint
    const intervalWait = Math.max(0, config.minIntervalMs - (now - entry.lastCallTime));

    // Check calls-per-minute constraint
    let quotaWait = 0;
    if (entry.timestamps.length >= config.maxCallsPerMinute) {
      const oldestInWindow = entry.timestamps[0];
      quotaWait = Math.max(0, oldestInWindow + WINDOW_MS - now);
    }

    return Math.max(intervalWait, quotaWait);
  }

  /**
   * Execute `fn` only when the rate limit allows it. If the rate limit has been
   * exceeded, this will automatically wait before invoking `fn`.
   */
  async function execute<T>(
    fn: () => Promise<T>,
    options?: { key?: string }
  ): Promise<T> {
    const key = options?.key ?? "_default";
    const waitMs = getWaitTime(key);

    if (waitMs > 0) {
      console.warn(
        `[RateLimiter] Key "${key}" — waiting ${waitMs}ms before executing`
      );
      await sleep(waitMs);
    }

    const now = Date.now();
    const entry = getEntry(key);
    pruneOldTimestamps(entry);

    entry.timestamps.push(now);
    entry.lastCallTime = now;

    return fn();
  }

  /** Reset the rate limiter for a specific key. */
  function reset(key: string = "_default"): void {
    entries.delete(key);
  }

  /** Reset all rate limiter state. */
  function resetAll(): void {
    entries.clear();
  }

  return { execute, getWaitTime, reset, resetAll };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown, retryableCodes: number[]): boolean {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;

    // Check for HTTP status codes (Google API errors use `status` or `code`)
    if (
      (typeof err.status === "number" && retryableCodes.includes(err.status)) ||
      (typeof err.code === "number" && retryableCodes.includes(err.code as number))
    ) {
      return true;
    }

    // Check error message for rate/quota keywords
    if (typeof err.message === "string") {
      const msg = (err.message as string).toLowerCase();
      if (msg.includes("rate") || msg.includes("quota") || msg.includes("429") || msg.includes("resource_exhausted")) {
        return true;
      }
    }
  }

  return false;
}

function errorSummary(error: unknown): string {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    const status = err.status ?? err.code ?? "";
    const message = typeof err.message === "string" ? err.message : "";
    if (status && message) return `${status}: ${message}`;
    if (message) return message;
    if (status) return String(status);
  }
  return String(error);
}