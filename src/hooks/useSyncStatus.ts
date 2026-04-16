import { useState, useEffect } from "react";
import { offlineQueue } from "../lib/offline/offlineQueue";

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateStatus = async () => {
      const queue = await offlineQueue.getQueue();
      setPendingCount(queue.length);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(updateStatus, 2000);
    updateStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { pendingCount, isOnline };
}
