interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const MAX_ENTRIES = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;

const globalRateLimitState = globalThis as typeof globalThis & {
  orbitRateLimitStore?: Map<string, RateLimitEntry>;
  orbitRateLimitLastCleanup?: number;
};

const store =
  globalRateLimitState.orbitRateLimitStore ??
  (globalRateLimitState.orbitRateLimitStore = new Map<string, RateLimitEntry>());

function cleanupExpiredEntries(now: number) {
  const lastCleanup = globalRateLimitState.orbitRateLimitLastCleanup ?? 0;

  if (now - lastCleanup < CLEANUP_INTERVAL_MS && store.size < MAX_ENTRIES) {
    return;
  }

  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }

  if (store.size >= MAX_ENTRIES) {
    const entriesToRemove = store.size - Math.floor(MAX_ENTRIES * 0.9);
    const oldestKeys = store.keys();

    for (let index = 0; index < entriesToRemove; index += 1) {
      const oldestKey = oldestKeys.next().value;
      if (typeof oldestKey === "string") {
        store.delete(oldestKey);
      }
    }
  }

  globalRateLimitState.orbitRateLimitLastCleanup = now;
}

export function consumeRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { attempts: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.attempts >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.attempts += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}
