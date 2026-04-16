
import { useState, useEffect, useCallback } from 'react';
import { cacheStore } from '../lib/cache/cacheStore';
import { UIState } from '../components/ui/ScreenState';

interface SmartQueryOptions {
  ttl?: number;
  revalidateOnFocus?: boolean;
  refreshInterval?: number;
}

export function useSmartQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: SmartQueryOptions = {}
) {
  const { ttl = 300000, revalidateOnFocus = true, refreshInterval } = options;
  
  const [data, setData] = useState<T | null>(() => cacheStore.get<T>(key));
  const [uiState, setUiState] = useState<UIState>(data ? 'success' : 'loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<any>(null);

  const executeFetch = useCallback(async (isBackground = false) => {
    if (!isBackground) setUiState('loading');
    else setIsRefreshing(true);

    try {
      const result = await fetcher();
      cacheStore.set(key, result);
      setData(result);
      setUiState('success');
      setError(null);
    } catch (err) {
      console.error(`SmartQuery Error [${key}]:`, err);
      setError(err);
      if (!data) setUiState('error');
    } finally {
      setIsRefreshing(false);
    }
  }, [key, fetcher, data]);

  useEffect(() => {
    const cached = cacheStore.get<T>(key);
    const stale = cacheStore.isStale(key, ttl);

    if (cached) {
      setData(cached);
      setUiState('success');
      if (stale) executeFetch(true);
    } else {
      executeFetch(false);
    }
  }, [key, ttl]); // Removed executeFetch to avoid loop if fetcher is not memoized

  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      if (cacheStore.isStale(key, ttl)) {
        executeFetch(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, ttl, revalidateOnFocus, executeFetch]);

  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      executeFetch(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, executeFetch]);

  return {
    data,
    uiState,
    isRefreshing,
    isLoading: uiState === 'loading',
    error,
    refresh: () => executeFetch(true),
    mutate: (newData: T) => {
      cacheStore.set(key, newData);
      setData(newData);
    }
  };
}
