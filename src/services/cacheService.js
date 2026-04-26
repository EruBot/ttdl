import { CACHE_MAX_SIZE, CACHE_TTL_MS } from "../config/env.js";

class LruTtlCache {
  constructor(limit, ttlMs) {
    this.limit = limit;
    this.ttlMs = ttlMs;
    this.map = new Map();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }

    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    }

    while (this.map.size >= this.limit) {
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
    }

    this.map.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs
    });
  }

  delete(key) {
    this.map.delete(key);
  }
}

export const cache = new LruTtlCache(CACHE_MAX_SIZE, CACHE_TTL_MS);