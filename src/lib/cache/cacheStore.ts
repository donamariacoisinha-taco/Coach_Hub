interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const debugCache = (...args: any[]) => {
  if (import.meta.env.DEV) console.debug(...args);
};

class CacheStore {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly MAX_SIZE = 100;

  set<T>(key: string, data: T): void {
    // Evict oldest if max size reached (FIFO)
    if (this.cache.size >= this.MAX_SIZE && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    
    debugCache(`[CacheStore] SET: ${key}`);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      debugCache(`[CacheStore] MISS: ${key}`);
      return null;
    }
    debugCache(`[CacheStore] HIT: ${key}`);
    return item.data;
  }

  getTimestamp(key: string): number | null {
    const item = this.cache.get(key);
    return item ? item.timestamp : null;
  }

  isStale(key: string, ttlMs: number): boolean {
    const item = this.cache.get(key);
    if (!item) return true;
    const isStale = Date.now() - item.timestamp > ttlMs;
    if (isStale) debugCache(`[CacheStore] STALE: ${key}`);
    return isStale;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      debugCache(`[CacheStore] CLEAR: ${key}`);
    } else {
      this.cache.clear();
      debugCache(`[CacheStore] CLEAR ALL`);
    }
  }

  clearPrefix(prefix: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        debugCache(`[CacheStore] CLEAR PREFIX (${prefix}): ${key}`);
      }
    }
  }

  // Periodic cleanup of very old items (e.g. > 1 hour)
  cleanup(): void {
    const now = Date.now();
    const ONE_HOUR = 3600000;
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > ONE_HOUR) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheStore = new CacheStore();
