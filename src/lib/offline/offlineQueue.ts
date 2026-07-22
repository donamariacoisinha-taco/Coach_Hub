import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';

export interface QueueItem {
  id: string; // queue item id
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface DeadLetterItem extends QueueItem {
  failedAt: number;
  reason: string;
}

const DB_NAME = 'coach_offline_db';
const STORE_NAME = 'sync_queue';
const DEAD_LETTER_STORE_NAME = 'sync_dead_letter_queue';
const DB_VERSION = 2;

class OfflineQueue {
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(DEAD_LETTER_STORE_NAME)) {
          db.createObjectStore(DEAD_LETTER_STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  async addToQueue(type: string, payload: any): Promise<string> {
    const id = payload?.client_id || uuidv4();
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
    const deadLetters = await db.getAll(DEAD_LETTER_STORE_NAME);
    const toRemove = items.filter(item => item.payload?.history_id === historyId);
    const deadLettersToRemove = deadLetters.filter(item => item.payload?.history_id === historyId);

    for (const item of toRemove) {
      await db.delete(STORE_NAME, item.id);
    }
    for (const item of deadLettersToRemove) {
      await db.delete(DEAD_LETTER_STORE_NAME, item.id);
    }
  }

  async updateItem(item: QueueItem): Promise<void> {
    const db = await this.db;
    await db.put(STORE_NAME, item);
  }

  async moveToDeadLetter(item: QueueItem, reason: string): Promise<void> {
    const db = await this.db;
    const deadLetter: DeadLetterItem = {
      ...item,
      failedAt: Date.now(),
      reason,
      lastError: reason,
    };
    await db.put(DEAD_LETTER_STORE_NAME, deadLetter);
    await db.delete(STORE_NAME, item.id);
  }

  async getDeadLetters(): Promise<DeadLetterItem[]> {
    const db = await this.db;
    return db.getAll(DEAD_LETTER_STORE_NAME);
  }

  async retryDeadLetter(id: string): Promise<void> {
    const db = await this.db;
    const item = await db.get(DEAD_LETTER_STORE_NAME, id) as DeadLetterItem | undefined;
    if (!item) return;
    const retryItem: QueueItem = {
      id: item.id,
      type: item.type,
      payload: item.payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await db.put(STORE_NAME, retryItem);
    await db.delete(DEAD_LETTER_STORE_NAME, id);
  }
}

export const offlineQueue = new OfflineQueue();