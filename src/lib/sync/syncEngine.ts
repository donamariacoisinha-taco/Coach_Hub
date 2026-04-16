
import { offlineQueue, QueueItem } from '../offline/offlineQueue';
import { workoutApi } from '../api/workoutApi';
import { useAppStore } from '../../app/store/appStore';

class SyncEngine {
  private isProcessing = false;
  private lastProcessTime = 0;
  private readonly MIN_INTERVAL = 2000; // 2 seconds between syncs

  async processQueue() {
    // Protection against rapid re-triggers and infinite loops
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

    console.log(`[SyncEngine] START: Processing ${queue.length} items...`);

    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      try {
        const success = await this.processItem(item);
        if (success) {
          await offlineQueue.removeFromQueue(item.id);
          successCount++;
          console.log(`[SyncEngine] SUCCESS: Item ${item.id} (${item.type})`);
        } else {
          failCount++;
          item.retryCount++;
          console.warn(`[SyncEngine] RETRY: Item ${item.id} failed (${item.retryCount}/3)`);
          
          if (item.retryCount >= 3) {
            console.error(`[SyncEngine] DISCARD: Item ${item.id} failed after 3 retries.`);
            await offlineQueue.removeFromQueue(item.id);
          } else {
            await offlineQueue.updateItem(item);
          }
        }
      } catch (err) {
        failCount++;
        console.error(`[SyncEngine] CRITICAL ERROR processing item ${item.id}:`, err);
      }
    }

    const remaining = await offlineQueue.getQueue();
    useAppStore.getState().setPendingCount(remaining.length);
    useAppStore.getState().setSyncing(false);
    this.isProcessing = false;
    
    console.log(`[SyncEngine] END: ${successCount} succeeded, ${failCount} failed. ${remaining.length} remaining.`);
  }

  private async processItem(item: QueueItem): Promise<boolean> {
    try {
      if (item.type === 'SAVE_SET') {
        const { error } = await workoutApi.saveSetLog(item.payload);
        // If error is uniqueness constraint (idempotency), it's a success
        if (error && (error as any).code === '23505') return true; 
        return !error;
      }
      return true;
    } catch (err) {
      return false;
    }
  }
}

export const syncEngine = new SyncEngine();
