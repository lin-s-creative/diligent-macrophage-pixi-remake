import type { RecordsStore, RecordsSummary, ScoreRecord } from './RecordsStore';

const DB_NAME = 'macrophage-records';
const STORE_NAME = 'records';
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = 'macrophage.records';

export class BrowserRecordsStore implements RecordsStore {
  async addRecord(record: Omit<ScoreRecord, 'id' | 'createdAt'>): Promise<ScoreRecord> {
    const fullRecord: ScoreRecord = {
      ...record,
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString()
    };

    try {
      const db = await this.openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(fullRecord);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      db.close();
    } catch {
      const records = this.readLocalStorage();
      records.push(fullRecord);
      this.writeLocalStorage(records);
    }

    return fullRecord;
  }

  async getSummary(limit = 5): Promise<RecordsSummary> {
    let records: ScoreRecord[];
    try {
      const db = await this.openDb();
      records = await new Promise<ScoreRecord[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve((request.result as ScoreRecord[]) ?? []);
        request.onerror = () => reject(request.error);
      });
      db.close();
    } catch {
      records = this.readLocalStorage();
    }

    records.sort((a, b) => b.score - a.score || Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return {
      bestScore: records[0]?.score ?? 0,
      gamesPlayed: records.length,
      records: records.slice(0, limit)
    };
  }

  private openDb(): Promise<IDBDatabase> {
    if (!('indexedDB' in window)) {
      return Promise.reject(new Error('IndexedDB is not supported.'));
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('score', 'score', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private readLocalStorage(): ScoreRecord[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeLocalStorage(records: ScoreRecord[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  }
}
