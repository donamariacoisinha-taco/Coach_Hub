
import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheStore } from '../lib/cacheStore';
import { UIState } from '../components/ui/ScreenState';

interface SmartQueryOptions {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
  enabled?: boolean;
}

export function useSmartQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: SmartQueryOptions = {}
) {
  const { 
    refreshInterval = 0, 
    revalidateOnFocus = true,
    enabled = true 
  } = options;

  const [data, setData] = useState<T | null>(() => cacheStore.get<T>(key));
  const [isLoading, setIsLoading] = useState(!cacheStore.has(key));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<any>(null);
  const [uiState, setUiState] = useState<UIState>(() => {
    if (cacheStore.has(key)) return 'success';
    return 'loading';
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const executeFetch = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      if (!cacheStore.has(key)) {
        setIsLoading(true);
        setUiState('loading');
      } else {
        setIsRefreshing(true);
      }
    } else {
      setIsRefreshing(true);
    }

    try {
      const result = await fetcherRef.current();
      setData(result);
      cacheStore.set(key, result);
      setError(null);
      setUiState(Array.isArray(result) && result.length === 0 ? 'empty' : 'success');
    } catch (err) {
      setError(err);
      if (!cacheStore.has(key)) {
        setUiState('error');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [key]);

  useEffect(() => {
    if (enabled) {
      executeFetch();
    }
  }, [executeFetch, enabled]);

  // Background Refresh on Focus
  useEffect(() => {
    if (!revalidateOnFocus || !enabled) return;

    const handleFocus = () => {
      executeFetch(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [executeFetch, revalidateOnFocus, enabled]);

  // Interval Refresh
  useEffect(() => {
    if (refreshInterval <= 0 || !enabled) return;

    const interval = setInterval(() => {
      executeFetch(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [executeFetch, refreshInterval, enabled]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    uiState,
    refresh: () => executeFetch(true),
    mutate: (newData: T) => {
      setData(newData);
      cacheStore.set(key, newData);
    }
  };
}
