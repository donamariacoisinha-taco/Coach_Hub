import { openDB } from "idb";

export const dbPromise = openDB("workout-db", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("queue")) {
      db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
    }
  },
});

export type QueueItem = {
  id?: number;
  type: "SET_LOG";
  payload: any;
  createdAt: number;
  retryCount: number;
};
