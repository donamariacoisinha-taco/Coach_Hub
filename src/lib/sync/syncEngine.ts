import { offlineQueue, QueueItem } from '../offline/offlineQueue';
import { workoutApi } from '../api/workoutApi';
import { useAppStore } from '../../app/store/appStore';
import {
  bucketOperationalCount,
  recordOperationalEvent,
} from '../telemetry/operationalTelemetry';

const isDev = typeof import.meta !== 'undefined' ? import.meta.env.DEV : process.env.NODE_ENV === 'development';

export type SyncProcessOptions = {
  force?: boolean;
};

class SyncEngine {
  private isProcessing = false;
  private lastProcessTime = 0;
  private readonly MIN_INTERVAL = 2000; // 2 seconds between automatic syncs
  private readonly MAX_RETRIES = 3;

  async processQueue(options: SyncProcessOptions = {}) {
    const now = Date.now();
    const throttled = !options.force && (now - this.lastProcessTime < this.MIN_INTERVAL);
    if (this.isProcessing || !navigator.onLine || throttled) {
      return;
    }

    const queue = await offlineQueue.getQueue();
    if (queue.length === 0) {
      const deadLetters = await offlineQueue.getDeadLetters();
      useAppStore.getState().setPendingCount(deadLetters.length);
      return;
    }

    const source = options.force ? 'manual' : 'automatic';
    recordOperationalEvent('sync_cycle_started', {
      source,
      countBucket: bucketOperationalCount(queue.length),
    });

    this.isProcessing = true;
    this.lastProcessTime = now;
    useAppStore.getState().setSyncing(true);
    useAppStore.getState().setPendingCount(queue.length);

    if (isDev) console.log(`[SyncEngine] START: Processing ${queue.length} items...`);

    let successCount = 0;
    let failCount = 0;

    try {
      for (const item of queue) {
        try {
          const { success, error, terminal } = await this.processItem(item);
          if (success) {
            await offlineQueue.removeFromQueue(item.id);
            successCount++;
            if (isDev) console.log(`[SyncEngine] SUCCESS: Item ${item.id} (${item.type})`);
          } else {
            failCount++;
            item.retryCount++;
            item.lastError = error?.message || String(error || 'Unknown error');

            if (terminal || item.retryCount >= this.MAX_RETRIES) {
              const reason = terminal
                ? `Terminal sync failure: ${item.lastError}`
                : `Retry limit reached after ${this.MAX_RETRIES} attempts: ${item.lastError}`;
              console.error(`[SyncEngine] DEAD_LETTER: Preserving failed item ${item.id}. ${reason}`);
              await offlineQueue.moveToDeadLetter(item, reason);
            } else {
              console.warn(`[SyncEngine] RETRY: Item ${item.id} failed (${item.retryCount}/${this.MAX_RETRIES}). Error: ${item.lastError}`);
              await offlineQueue.updateItem(item);
            }
          }
        } catch (err: any) {
          failCount++;
          item.retryCount++;
          item.lastError = err?.message || String(err);
          console.error(`[SyncEngine] CRITICAL ERROR processing item ${item.id}:`, err);
          if (item.retryCount >= this.MAX_RETRIES) {
            await offlineQueue.moveToDeadLetter(item, `Critical processing failure: ${item.lastError}`);
          } else {
            await offlineQueue.updateItem(item);
          }
        }
      }
    } finally {
      const remaining = await offlineQueue.getQueue();
      const deadLetters = await offlineQueue.getDeadLetters();
      useAppStore.getState().setPendingCount(remaining.length + deadLetters.length);
      useAppStore.getState().setSyncing(false);
      this.isProcessing = false;

      if (failCount > 0) {
        recordOperationalEvent('sync_cycle_failed', {
          source,
          result: successCount > 0 ? 'partial' : 'failure',
          countBucket: bucketOperationalCount(failCount),
          healthLevel: deadLetters.length > 0 ? 'attention' : 'pending',
        });
      } else {
        recordOperationalEvent('sync_cycle_succeeded', {
          source,
          result: 'success',
          countBucket: bucketOperationalCount(successCount),
          healthLevel: remaining.length + deadLetters.length === 0 ? 'healthy' : 'pending',
        });
      }

      if (isDev) console.log(`[SyncEngine] END: ${successCount} succeeded, ${failCount} failed. ${remaining.length} queued, ${deadLetters.length} dead-lettered.`);
    }
  }

  private async processItem(item: QueueItem): Promise<{ success: boolean; error?: any; terminal?: boolean }> {
    try {
      if (item.type === 'SAVE_SET') {
        const { error } = await workoutApi.saveSetLog(item.payload);
        // If error is uniqueness constraint (idempotency), it's a success.
        if (error && (error as any).code === '23505') return { success: true };

        // Foreign-key violations indicate corrupted ordering or missing parent data.
        // Preserve them for explicit reconciliation instead of discarding data.
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
