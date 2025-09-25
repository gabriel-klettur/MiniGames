import type { GameState } from '../game/types';
import type { AIMove } from './moves';
import { computeKey } from './zobrist';
import { decodeSignature, type MoveSignature } from './signature';

// Opening book structure
export type BookEntry = { keyHi: number; keyLo: number; bestMove: MoveSignature };
export type BookFile = { version: number | string; entries: BookEntry[] };

type BookCache = { version: string; map: Map<string, MoveSignature> };
let memCache: BookCache | null = null;

// Minimal IndexedDB wrapper for book cache (separate DB to avoid coupling)
const DB_NAME = 'pylos-book-db';
const DB_VERSION = 1;
const STORE = 'book';

type DbRecord = { id: 'book'; version: string; entries: BookEntry[] };

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

async function dbLoad(): Promise<DbRecord | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get('book');
      req.onsuccess = () => resolve((req.result || null) as DbRecord | null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function dbSave(rec: DbRecord): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.put(rec);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

async function fetchBookFile(): Promise<BookFile | null> {
  try {
    const res = await fetch('/book.json', { cache: 'force-cache' });
    if (!res.ok) return null;
    const json = await res.json();
    const file = json as BookFile;
    if (!file || !Array.isArray(file.entries)) return null;
    return file;
  } catch {
    return null;
  }
}

function toVersionString(v: number | string | undefined): string {
  if (v === undefined || v === null) return '0';
  return String(v);
}

function buildMap(entries: BookEntry[]): Map<string, MoveSignature> {
  const m = new Map<string, MoveSignature>();
  for (const e of entries) {
    const key = `${e.keyHi >>> 0}:${e.keyLo >>> 0}`;
    m.set(key, e.bestMove >>> 0 as MoveSignature);
  }
  return m;
}

async function ensureBook(): Promise<BookCache | null> {
  if (memCache) return memCache;
  // Try IndexedDB
  const rec = await dbLoad();
  if (rec && rec.entries && rec.entries.length >= 0) {
    memCache = { version: rec.version, map: buildMap(rec.entries) };
    return memCache;
  }
  // Fallback to fetch
  const file = await fetchBookFile();
  if (!file) return null;
  const version = toVersionString(file.version);
  const map = buildMap(file.entries || []);
  memCache = { version, map };
  // Save to IDB (fire and forget)
  dbSave({ id: 'book', version, entries: file.entries || [] }).catch(() => {});
  return memCache;
}

export async function probeBook(state: GameState): Promise<AIMove | null> {
  const book = await ensureBook();
  if (!book) return null;
  const k = computeKey(state);
  const sig = book.map.get(`${k.hi >>> 0}:${k.lo >>> 0}`);
  if (!sig && book.version) {
    // Optional: try without reserves if v1 indexed only occupancy+stm (not implemented here)
  }
  if (sig === undefined) return null;
  try {
    return decodeSignature(sig);
  } catch {
    return null;
  }
}
