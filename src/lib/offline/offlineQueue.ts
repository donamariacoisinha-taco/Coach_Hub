
import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

export interface QueueItem {
  id: string; // client_id
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'coach_offline_db';
const STORE_NAME = 'sync_queue';

class OfflineQueue {
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      },
    });
  }

  async addToQueue(type: string, payload: any): Promise<string> {
    const id = uuidv4();
    const item: QueueItem = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    const db = await this.db;
    await db.put(STORE_NAME, item);
    return id;
  }

  async getQueue(): Promise<QueueItem[]> {
    const db = await this.db;
    return db.getAll(STORE_NAME);
  }

  async removeFromQueue(id: string): Promise<void> {
    const db = await this.db;
    await db.delete(STORE_NAME, id);
  }

  async clearByHistoryId(historyId: string): Promise<void> {
    const db = await this.db;
    const items = await db.getAll(STORE_NAME);
    const toRemove = items.filter(item => item.payload?.history_id === historyId);
    for (const item of toRemove) {
      await db.delete(STORE_NAME, item.id);
    }
  }

  async updateItem(item: QueueItem): Promise<void> {
    const db = await this.db;
    await db.put(STORE_NAME, item);
  }
}

export const offlineQueue = new OfflineQueue();
