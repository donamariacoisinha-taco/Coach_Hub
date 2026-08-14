
import { useEffect } from 'react';
import { syncEngine } from '../lib/sync/syncEngine';
import { useOfflineStatus } from './useOfflineStatus';
import { authApi, isGuestSession } from '../lib/api/authApi';

export function useSync() {
  const { isOnline } = useOfflineStatus();

  useEffect(() => {
    const syncIfAuthenticated = async () => {
      const session = await authApi.getSession();
      if (!session || isGuestSession(session)) return;
      await syncEngine.processQueue();
    };
    // Initial sync
    void syncIfAuthenticated();

    // Periodic sync every 10 seconds
    const interval = setInterval(() => {
      void syncIfAuthenticated();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline) {
      void (async () => {
        const session = await authApi.getSession();
        if (session && !isGuestSession(session)) await syncEngine.processQueue();
      })();
    }
  }, [isOnline]);

  useEffect(() => {
    const handleFocus = async () => {
      const session = await authApi.getSession();
      if (session && !isGuestSession(session)) await syncEngine.processQueue();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
}
