import { RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS } from "../config/env.js";

class SlidingWindowRateLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.map = new Map();
  }

  allow(key) {
    const now = Date.now();
    const list = this.map.get(key) ?? [];
    const recent = list.filter((ts) => now - ts < this.windowMs);

    if (recent.length >= this.limit) {
      const retryAfterMs = this.windowMs - (now - recent[0]);
      this.map.set(key, recent);
      return { allowed: false, retryAfterMs };
    }

    recent.push(now);
    this.map.set(key, recent);
    return { allowed: true, retryAfterMs: 0 };
  }
}

export const rateLimiter = new SlidingWindowRateLimiter(
  RATE_LIMIT_COUNT,
  RATE_LIMIT_WINDOW_MS
);