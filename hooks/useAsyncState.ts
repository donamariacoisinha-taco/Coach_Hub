
import { useState, useMemo } from 'react';
import { UIState } from '../components/ui/ScreenState';
import { AppErrorType, mapError } from '../lib/errorHandling';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: any | null;
  isEmpty: boolean;
}

export function useAsyncState<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: true,
    error: null,
    isEmpty: false
  });

  const uiState = useMemo((): UIState => {
    if (state.loading) return 'loading';
    if (state.error) return 'error';
    if (state.isEmpty || !state.data || (Array.isArray(state.data) && state.data.length === 0)) return 'empty';
    return 'success';
  }, [state]);

  const errorDetails = useMemo(() => {
    if (!state.error) return null;
    return mapError(state.error);
  }, [state.error]);

  const setData = (data: T) => {
    const isEmpty = !data || (Array.isArray(data) && data.length === 0);
    setState(prev => ({ ...prev, data, loading: false, error: null, isEmpty }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: any) => {
    setState(prev => ({ ...prev, error, loading: false }));
  };

  const reset = () => {
    setState({
      data: initialData,
      loading: true,
      error: null,
      isEmpty: false
    });
  };

  return {
    ...state,
    uiState,
    errorDetails,
    setData,
    setLoading,
    setError,
    reset
  };
}
