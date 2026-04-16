
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

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
    
    console.log(`[CacheStore] SET: ${key}`);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      console.log(`[CacheStore] MISS: ${key}`);
      return null;
    }
    console.log(`[CacheStore] HIT: ${key}`);
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
    if (isStale) console.log(`[CacheStore] STALE: ${key}`);
    return isStale;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`[CacheStore] CLEAR: ${key}`);
    } else {
      this.cache.clear();
      console.log(`[CacheStore] CLEAR ALL`);
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
