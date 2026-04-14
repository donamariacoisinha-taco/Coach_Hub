import { dbPromise, QueueItem } from "./offlineDB";

export async function addToQueue(item: QueueItem) {
  const db = await dbPromise;
  await db.add("queue", item);
}

export async function getQueue() {
  const db = await dbPromise;
  return db.getAll("queue");
}

export async function removeFromQueue(id: number) {
  const db = await dbPromise;
  await db.delete("queue", id);
}

export async function updateQueueItem(item: QueueItem) {
  const db = await dbPromise;
  await db.put("queue", item);
}
