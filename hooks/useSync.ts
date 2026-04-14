import { useEffect } from "react";
import { syncQueue } from "../lib/syncEngine";

export function useSync() {
  useEffect(() => {
    // Tenta sincronizar imediatamente ao carregar
    if (navigator.onLine) {
      syncQueue();
    }

    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncQueue();
      }
    }, 5000);

    // Também tenta sincronizar quando o navegador volta a ficar online
    window.addEventListener('online', syncQueue);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', syncQueue);
    };
  }, []);
}
