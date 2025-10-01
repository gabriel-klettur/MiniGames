import type { Key64 } from '../ia/zobrist';

// Lightweight persistent repetition database backed by localStorage.
// Stores an occurrence log (order queue) and counts per Zobrist key.
// We evict oldest occurrences to keep storage bounded.

const LS_KEY = 'pylos.repeatdb.v1';
const MAX_OCCURRENCES = 5000; // cap on occurrence queue length
const EVICT_PORTION = 0.1; // evict ~10% when above cap
const GLOBAL_PENALTY_KEY = 'pylos.repeats.globalPenalty';
const GLOBAL_ENABLED_KEY = 'pylos.repeats.globalEnabled';
const LAST_IMPACT_KEY = 'pylos.repeats.lastImpact';
const IMPACT_HISTORY_KEY = 'pylos.repeats.impactHistory.v1';

export type RepeatStore = {
  // Occurrence queue of key strings ("hi:lo"), oldest first
  order: string[];
  // Counts per key string
  map: Record<string, number>;
};

function load(): RepeatStore {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RepeatStore>;
      if (parsed && Array.isArray(parsed.order) && typeof parsed.map === 'object' && parsed.map) {
        return { order: parsed.order.slice(0, MAX_OCCURRENCES * 2), map: parsed.map as Record<string, number> };
      }
    }
  } catch {}
  return { order: [], map: {} };
}

function save(store: RepeatStore): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {}
}

function toKeyStr(k: Key64): string {
  return `${(k.hi >>> 0)}:${(k.lo >>> 0)}`;
}

/**
 * Record one occurrence of a state key.
 * Uses a bounded queue and per-key counts.
 */
export function recordStateKey(k: Key64): void {
  const store = load();
  const s = toKeyStr(k);
  store.order.push(s);
  store.map[s] = (store.map[s] ?? 0) + 1;
  // Evict if needed (remove oldest occurrences and decrement their counts)
  if (store.order.length > MAX_OCCURRENCES) {
    const toRemove = Math.max(1, Math.floor(store.order.length * EVICT_PORTION));
    for (let i = 0; i < toRemove; i++) {
      const old = store.order.shift();
      if (!old) break;
      const c = (store.map[old] ?? 0) - 1;
      if (c <= 0) delete store.map[old]; else store.map[old] = c;
    }
  }
  save(store);
}

/**
 * Build a weighted avoid list for the AI search engine.
 * - scale: base weight per log2(1+count) (default 50)
 * - limit: max number of keys to include (default 256)
 * - minCount: only include keys with count >= minCount (default 2)
 */
export function getAvoidList(params?: { scale?: number; limit?: number; minCount?: number }): Array<{ hi: number; lo: number; weight: number }> {
  const scale = Math.max(1, Math.floor(params?.scale ?? 50));
  const limit = Math.max(1, Math.floor(params?.limit ?? 256));
  const minCount = Math.max(1, Math.floor(params?.minCount ?? 2));
  const store = load();
  const entries = Object.entries(store.map)
    .filter(([, c]) => (c ?? 0) >= minCount)
    .map(([s, c]) => {
      const [hiStr, loStr] = s.split(':');
      const hi = (parseInt(hiStr, 10) >>> 0) || 0;
      const lo = (parseInt(loStr, 10) >>> 0) || 0;
      const weight = Math.max(scale, Math.floor(scale * Math.log2(1 + (c || 0))));
      return { hi, lo, weight };
    });
  // Prefer the most frequent keys
  entries.sort((a, b) => b.weight - a.weight);
  return entries.slice(0, limit);
}

/** Clear all repetition data (optional, for devtools/tests). */
export function clearRepetitionDb(): void {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

/** Return top repeated keys with counts, sorted desc. */
export function getTopRepeated(limit: number = 50): Array<{ key: string; hi: number; lo: number; count: number }> {
  const store = load();
  const entries = Object.entries(store.map).map(([s, c]) => {
    const [hiStr, loStr] = s.split(':');
    return { key: s, hi: (parseInt(hiStr, 10) >>> 0) || 0, lo: (parseInt(loStr, 10) >>> 0) || 0, count: c || 0 };
  });
  entries.sort((a, b) => b.count - a.count);
  return entries.slice(0, Math.max(1, Math.floor(limit)));
}

/** Export DB as JSON string. */
export function exportRepetitionDb(): string {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (typeof raw === 'string' && raw.length > 0) return raw;
  } catch {}
  return JSON.stringify({ order: [], map: {} } as RepeatStore);
}

/** Import DB from JSON string (replace). */
export function importRepetitionDb(json: string): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(json) as Partial<RepeatStore>;
    if (!parsed || !Array.isArray(parsed.order) || typeof parsed.map !== 'object' || parsed.map == null) {
      return { ok: false, error: 'Formato inválido' };
    }
    const store: RepeatStore = { order: parsed.order, map: parsed.map as Record<string, number> };
    save(store);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || err) };
  }
}

// --- Global cross-game repetition penalty management ---
/** Read the global cross-game repetition penalty scale (0..500), default 50. */
export function getGlobalPenalty(): number {
  try {
    const raw = localStorage.getItem(GLOBAL_PENALTY_KEY);
    if (raw != null) {
      const v = Number(raw);
      if (Number.isFinite(v)) return Math.max(0, Math.min(500, Math.floor(v)));
    }
  } catch {}
  return 50;
}

/** Persist the global cross-game repetition penalty scale (0..500). */
export function setGlobalPenalty(v: number): void {
  try {
    const n = Math.max(0, Math.min(500, Math.floor(Number(v))));
    localStorage.setItem(GLOBAL_PENALTY_KEY, String(n));
  } catch {}
}

/** Whether the cross-game repetition avoidance is enabled (default false). */
export function getGlobalEnabled(): boolean {
  try {
    const raw = localStorage.getItem(GLOBAL_ENABLED_KEY);
    if (raw == null) return false;
    const val = String(raw).toLowerCase();
    if (val === '0' || val === 'false' || val === 'off' || val === 'no') return false;
    if (val === '1' || val === 'true' || val === 'on' || val === 'yes') return true;
  } catch {}
  return false;
}

/** Persist on/off for cross-game repetition avoidance. */
export function setGlobalEnabled(v: boolean): void {
  try {
    localStorage.setItem(GLOBAL_ENABLED_KEY, v ? '1' : '0');
  } catch {}
}

export type AvoidImpact = { count: number; weight: number; ts: number };

/** Read the most recent avoid impact metrics recorded by the AI (or null if none). */
export function getLastAvoidImpact(): AvoidImpact | null {
  try {
    const raw = localStorage.getItem(LAST_IMPACT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<AvoidImpact>;
    const count = Math.max(0, Math.floor(Number(p?.count ?? 0)));
    const weight = Math.max(0, Math.floor(Number(p?.weight ?? 0)));
    const ts = Math.max(0, Math.floor(Number(p?.ts ?? 0)));
    if (!ts) return null;
    return { count, weight, ts };
  } catch { return null; }
}

/** Persist the most recent avoid impact metrics from AI. */
export function setLastAvoidImpact(impact: AvoidImpact): void {
  try {
    const count = Math.max(0, Math.floor(Number(impact?.count ?? 0)));
    const weight = Math.max(0, Math.floor(Number(impact?.weight ?? 0)));
    const ts = Math.max(0, Math.floor(Number(impact?.ts ?? Date.now())));
    localStorage.setItem(LAST_IMPACT_KEY, JSON.stringify({ count, weight, ts }));
  } catch {}
}

/** Return the stored history of avoid impacts (most recent last). */
export function getImpactHistory(max?: number): AvoidImpact[] {
  try {
    const raw = localStorage.getItem(IMPACT_HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as any[];
    const out: AvoidImpact[] = Array.isArray(arr) ? arr.map((e) => ({
      count: Math.max(0, Math.floor(Number(e?.count ?? 0))),
      weight: Math.max(0, Math.floor(Number(e?.weight ?? 0))),
      ts: Math.max(0, Math.floor(Number(e?.ts ?? 0))),
    })).filter((e) => e.ts > 0) : [];
    if (typeof max === 'number' && max > 0) return out.slice(Math.max(0, out.length - max));
    return out;
  } catch { return []; }
}

/** Append an impact to history, trimming to a capacity (default 200). */
export function appendImpactHistory(impact: AvoidImpact, capacity: number = 200): void {
  try {
    const cur = getImpactHistory();
    const entry: AvoidImpact = {
      count: Math.max(0, Math.floor(Number(impact?.count ?? 0))),
      weight: Math.max(0, Math.floor(Number(impact?.weight ?? 0))),
      ts: Math.max(0, Math.floor(Number(impact?.ts ?? Date.now()))),
    };
    cur.push(entry);
    const cap = Math.max(10, Math.min(5000, Math.floor(capacity)));
    const start = Math.max(0, cur.length - cap);
    const trimmed = start > 0 ? cur.slice(start) : cur;
    localStorage.setItem(IMPACT_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}

/** Clear the impact history. */
export function clearImpactHistory(): void {
  try { localStorage.removeItem(IMPACT_HISTORY_KEY); } catch {}
}
