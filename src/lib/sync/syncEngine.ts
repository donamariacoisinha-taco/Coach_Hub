import { offlineQueue, QueueItem } from '../offline/offlineQueue';
import { workoutApi } from '../api/workoutApi';
import { useAppStore } from '../../app/store/appStore';

class SyncEngine {
  private isProcessing = false;
  private lastProcessTime = 0;
  private readonly MIN_INTERVAL = 2000; // 2 seconds between syncs
  private readonly MAX_RETRIES = 5;

  async processQueue() {
    const now = Date.now();
    if (this.isProcessing || !navigator.onLine || (now - this.lastProcessTime < this.MIN_INTERVAL)) {
      return;
    }
    
    const queue = await offlineQueue.getQueue();
    if (queue.length === 0) {
      useAppStore.getState().setPendingCount(0);
      return;
    }

    this.isProcessing = true;
    this.lastProcessTime = now;
    useAppStore.getState().setSyncing(true);
    useAppStore.getState().setPendingCount(queue.length);

    if (import.meta.env.DEV) {
      console.debug(`[SyncEngine] START: Processing ${queue.length} items...`);
    }

    let successCount = 0;
    let failCount = 0;

    try {
      for (const item of queue) {
        try {
          const { success, error, terminal } = await this.processItem(item);
          if (success) {
            await offlineQueue.removeFromQueue(item.id);
            successCount++;
            if (import.meta.env.DEV) console.debug(`[SyncEngine] SUCCESS: Item ${item.id} (${item.type})`);
          } else {
            failCount++;
            item.retryCount++;
            item.lastError = error?.message || 'Unknown sync error';

            const shouldDeadLetter = terminal || item.retryCount >= this.MAX_RETRIES;
            if (shouldDeadLetter) {
              console.error(`[SyncEngine] DEAD_LETTER: Item ${item.id} (${item.type}) preserved after sync failure. Reason: ${item.lastError}`);
              await offlineQueue.moveToDeadLetter(item, item.lastError);
            } else {
              if (import.meta.env.DEV) {
                console.warn(`[SyncEngine] RETRY: Item ${item.id} failed (${item.retryCount}/${this.MAX_RETRIES}). Error: ${item.lastError}`);
              }
              await offlineQueue.updateItem(item);
            }
          }
        } catch (err: any) {
          failCount++;
          item.retryCount++;
          item.lastError = err?.message || String(err);
          console.error(`[SyncEngine] CRITICAL ERROR processing item ${item.id}. Preserving for retry.`, err);
          await offlineQueue.updateItem(item);
        }
      }
    } finally {
      const remaining = await offlineQueue.getQueue();
      useAppStore.getState().setPendingCount(remaining.length);
      useAppStore.getState().setSyncing(false);
      this.isProcessing = false;
      
      if (import.meta.env.DEV) {
        console.debug(`[SyncEngine] END: ${successCount} succeeded, ${failCount} failed. ${remaining.length} remaining.`);
      }
    }
  }

  private async processItem(item: QueueItem): Promise<{ success: boolean; error?: any; terminal?: boolean }> {
    try {
      if (item.type === 'SAVE_SET') {
        const { error } = await workoutApi.saveSetLog(item.payload);
        if (error && (error as any).code === '23505') return { success: true };

        // FK errors are terminal, but the data is preserved in dead-letter instead of silently discarded.
        if (error && (error as any).code === '23503') {
          return { success: false, error, terminal: true };
        }

        return { success: !error, error };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}

export const syncEngine = new SyncEngine();
