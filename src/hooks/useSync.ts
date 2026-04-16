
import { useEffect } from 'react';
import { syncEngine } from '../lib/sync/syncEngine';
import { useOfflineStatus } from './useOfflineStatus';

export function useSync() {
  const { isOnline } = useOfflineStatus();

  useEffect(() => {
    // Initial sync
    syncEngine.processQueue();

    // Periodic sync every 10 seconds
    const interval = setInterval(() => {
      syncEngine.processQueue();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncEngine.processQueue();
    }
  }, [isOnline]);

  useEffect(() => {
    const handleFocus = () => syncEngine.processQueue();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);
}
