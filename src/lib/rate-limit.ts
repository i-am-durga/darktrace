/**
 * In-memory sliding-window rate limiter for server actions.
 * Protects against credential stuffing, brute-force attempts, and rapid replay attacks.
 */

type RateLimitRecord = {
  timestamps: number[];
};

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private sweepInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private windowMs: number = 60_000, private maxAttempts: number = 5) {
    // Periodically sweep old entries to prevent memory growth
    if (typeof setInterval !== "undefined") {
      this.sweepInterval = setInterval(() => this.cleanup(), 5 * 60_000);
      if (this.sweepInterval && typeof this.sweepInterval.unref === "function") {
        this.sweepInterval.unref();
      }
    }
  }

  /**
   * Check if an action by `key` exceeds rate limits.
   * If allowed, records the timestamp and returns success: true.
   */
  public check(key: string): { success: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

    if (record.timestamps.length >= this.maxAttempts) {
      const oldestInWindow = record.timestamps[0];
      const resetMs = Math.max(0, oldestInWindow + this.windowMs - now);
      return { success: false, remaining: 0, resetMs };
    }

    record.timestamps.push(now);
    const remaining = this.maxAttempts - record.timestamps.length;
    return { success: true, remaining, resetMs: this.windowMs };
  }

  /** Reset attempts for a specific key (e.g. on successful login) */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /** Clean up stale entries */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  /** Clear all state (used for testing) */
  public clear(): void {
    this.store.clear();
  }
}

/** Global rate limiter instance for auth actions (5 attempts per minute per key) */
export const authRateLimiter = new InMemoryRateLimiter(60_000, 5);

/** Export class for testing */
export { InMemoryRateLimiter };
