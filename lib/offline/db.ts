/**
 * IndexedDB storage helper for offline queue management.
 * Stores pending logs locally when the device is offline,
 * to be synced when network connectivity returns.
 */

export interface PendingLogItem {
  id: string;
  type: "create" | "update";
  content: string;
  date: string;
  weekPlanTaskId?: string | null;
  timestamp: number;
}

const DB_NAME = "semana_offline_db";
const DB_VERSION = 1;
const STORE_NAME = "pending_logs";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePendingLog(item: Omit<PendingLogItem, "timestamp">): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const fullItem: PendingLogItem = { ...item, timestamp: Date.now() };
    store.put(fullItem);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to save pending log to IndexedDB:", error);
  }
}

export async function getPendingLogs(): Promise<PendingLogItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function removePendingLog(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to remove pending log from IndexedDB:", error);
  }
}
