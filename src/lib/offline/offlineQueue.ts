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

export interface OfflineQueueSnapshot {
  queue: QueueItem[];
  deadLetters: DeadLetterItem[];
}

const DB_NAME = 'coach_offline_db';
const STORE_NAME = 'sync_queue';
const DEAD_LETTER_STORE_NAME = 'sync_dead_letter_queue';
const DB_VERSION = 2;

type QueueListener = () => void;

class OfflineQueue {
  private db: Promise<IDBPDatabase>;
  private listeners = new Set<QueueListener>();

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

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitChange(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // Queue persistence must not fail because a UI subscriber failed.
      }
    }
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
    this.emitChange();
    return id;
  }

  async getQueue(): Promise<QueueItem[]> {
    const db = await this.db;
    return db.getAll(STORE_NAME);
  }

  async getSnapshot(): Promise<OfflineQueueSnapshot> {
    const db = await this.db;
    const [queue, deadLetters] = await Promise.all([
      db.getAll(STORE_NAME) as Promise<QueueItem[]>,
      db.getAll(DEAD_LETTER_STORE_NAME) as Promise<DeadLetterItem[]>,
    ]);
    return { queue, deadLetters };
  }

  async removeFromQueue(id: string): Promise<void> {
    const db = await this.db;
    await db.delete(STORE_NAME, id);
    this.emitChange();
  }

  async clearByHistoryId(historyId: string): Promise<void> {
    const db = await this.db;
    const items = await db.getAll(STORE_NAME);
    const deadLetters = await db.getAll(DEAD_LETTER_STORE_NAME);
    const toRemove = items.filter(item => item.payload?.history_id === historyId);
    const deadLettersToRemove = deadLetters.filter(item => item.payload?.history_id === historyId);

    const tx = db.transaction([STORE_NAME, DEAD_LETTER_STORE_NAME], 'readwrite');
    for (const item of toRemove) {
      await tx.objectStore(STORE_NAME).delete(item.id);
    }
    for (const item of deadLettersToRemove) {
      await tx.objectStore(DEAD_LETTER_STORE_NAME).delete(item.id);
    }
    await tx.done;
    this.emitChange();
  }

  async updateItem(item: QueueItem): Promise<void> {
    const db = await this.db;
    await db.put(STORE_NAME, item);
    this.emitChange();
  }

  async moveToDeadLetter(item: QueueItem, reason: string): Promise<void> {
    const db = await this.db;
    const deadLetter: DeadLetterItem = {
      ...item,
      failedAt: Date.now(),
      reason,
      lastError: reason,
    };
    const tx = db.transaction([STORE_NAME, DEAD_LETTER_STORE_NAME], 'readwrite');
    await tx.objectStore(DEAD_LETTER_STORE_NAME).put(deadLetter);
    await tx.objectStore(STORE_NAME).delete(item.id);
    await tx.done;
    this.emitChange();
  }

  async getDeadLetters(): Promise<DeadLetterItem[]> {
    const db = await this.db;
    return db.getAll(DEAD_LETTER_STORE_NAME);
  }

  async retryDeadLetter(id: string): Promise<boolean> {
    const db = await this.db;
    const tx = db.transaction([STORE_NAME, DEAD_LETTER_STORE_NAME], 'readwrite');
    const deadLetterStore = tx.objectStore(DEAD_LETTER_STORE_NAME);
    const item = await deadLetterStore.get(id) as DeadLetterItem | undefined;
    if (!item) {
      await tx.done;
      return false;
    }

    const retryItem: QueueItem = {
      id: item.id,
      type: item.type,
      payload: item.payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await tx.objectStore(STORE_NAME).put(retryItem);
    await deadLetterStore.delete(id);
    await tx.done;
    this.emitChange();
    return true;
  }

  async retryAllDeadLetters(): Promise<number> {
    const db = await this.db;
    const tx = db.transaction([STORE_NAME, DEAD_LETTER_STORE_NAME], 'readwrite');
    const deadLetterStore = tx.objectStore(DEAD_LETTER_STORE_NAME);
    const items = await deadLetterStore.getAll() as DeadLetterItem[];
    const queueStore = tx.objectStore(STORE_NAME);

    for (const item of items) {
      const retryItem: QueueItem = {
        id: item.id,
        type: item.type,
        payload: item.payload,
        timestamp: Date.now(),
        retryCount: 0,
      };
      await queueStore.put(retryItem);
      await deadLetterStore.delete(item.id);
    }

    await tx.done;
    if (items.length > 0) this.emitChange();
    return items.length;
  }
}

export const offlineQueue = new OfflineQueue();
