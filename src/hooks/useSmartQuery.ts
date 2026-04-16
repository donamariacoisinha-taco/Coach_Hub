
import { useState, useEffect, useCallback } from 'react';
import { cacheStore } from '../lib/cache/cacheStore';
import { UIStatus } from '../components/ui/ScreenState';

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
  const [status, setStatus] = useState<UIStatus>(data ? 'success' : 'loading');
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<any>(null);

  const executeFetch = useCallback(async (isBackground = false) => {
    // Only show loading if we don't have data
    if (!isBackground && !data) {
      setStatus('loading');
    } else {
      setIsFetching(true);
    }

    try {
      const result = await fetcher();
      cacheStore.set(key, result);
      setData(result);
      
      // Check for empty state if result is an array
      if (Array.isArray(result) && result.length === 0) {
        setStatus('empty');
      } else {
        setStatus('success');
      }
      
      setError(null);
    } catch (err) {
      console.error(`SmartQuery Error [${key}]:`, err);
      setError(err);
      if (!data) setStatus('error');
    } finally {
      setIsFetching(false);
    }
  }, [key, fetcher, data]);

  useEffect(() => {
    const cached = cacheStore.get<T>(key);
    const stale = cacheStore.isStale(key, ttl);

    if (cached) {
      setData(cached);
      if (Array.isArray(cached) && cached.length === 0) {
        setStatus('empty');
      } else {
        setStatus('success');
      }
      if (stale) executeFetch(true);
    } else {
      executeFetch(false);
    }
  }, [key, ttl]); 

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
    status,
    isFetching,
    isLoading: status === 'loading',
    error,
    refresh: () => executeFetch(false),
    revalidate: () => executeFetch(true),
    mutate: (newData: T) => {
      cacheStore.set(key, newData);
      setData(newData);
      if (Array.isArray(newData) && newData.length === 0) {
        setStatus('empty');
      } else {
        setStatus('success');
      }
    }
  };
}
