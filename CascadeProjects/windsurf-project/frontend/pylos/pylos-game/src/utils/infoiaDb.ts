/*
 * Minimal IndexedDB wrapper for Pylos InfoIA simulations
 */

export type InfoIAPerMove = {
  elapsedMs: number;
  depthReached?: number;
  nodes?: number;
  nps?: number;
  score?: number;
  // New: keys to reconstruct opening book entries and chosen move
  keyHi?: number;
  keyLo?: number;
  moveSig?: number; // MoveSignature
};

export type InfoIAGameRecord = {
  id: string; // unique id
  createdAt: number; // epoch ms
  version: 'pylos-infoia-v1';
  depth: number; // difficulty used for both players
  timeMode: 'auto' | 'manual';
  timeSeconds?: number; // present when manual
  pliesLimit: number;
  moves: number; // number of plies actually played
  avgThinkMs: number; // average elapsedMs per AI computation
  totalThinkMs: number; // sum of elapsedMs
  winner: 'L' | 'D' | null;
  endedReason?: string;
  seed?: number;
  // New: repetition metrics observed during simulation
  // repeatMax: threshold used to consider a position "repeated enough"
  // repeatHits: number of times we reached that threshold across the game
  repeatMax?: number;
  repeatHits?: number;
  perMove: InfoIAPerMove[]; // detailed telemetry per ply
};

const DB_NAME = 'pylos-infoia-db';
const DB_VERSION = 1;
const STORE = 'simulations';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbSave(record: InfoIAGameRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function dbGetAll(): Promise<InfoIAGameRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []) as InfoIAGameRecord[]);
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbClear(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function makeId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  const u = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? (crypto as any).randomUUID().split('-')[0]
    : '';
  return ['sim', t, r, u].filter(Boolean).join('-');
}
