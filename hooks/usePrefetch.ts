
import { useCallback } from 'react';
import { cacheStore } from '../lib/cacheStore';

export function usePrefetch() {
  const prefetch = useCallback(async <T>(key: string, fetcher: () => Promise<T>) => {
    // Don't prefetch if we already have fresh data (e.g. less than 30 seconds old)
    const timestamp = cacheStore.getTimestamp(key);
    if (timestamp && Date.now() - timestamp < 30000) {
      return;
    }

    try {
      const data = await fetcher();
      cacheStore.set(key, data);
    } catch (err) {
      console.error(`Prefetch failed for key: ${key}`, err);
    }
  }, []);

  return prefetch;
}
