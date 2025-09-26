import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';

export type BookEntry = { keyHi: number; keyLo: number; bestMove: number };
export type OpeningBook = { version: string; entries: BookEntry[] };

/** Build an opening book from InfoIA records by picking the most frequent moveSig per Zobrist key. */
export function buildOpeningBook(records: InfoIAGameRecord[]): OpeningBook {
  // Map key ("hi:lo") -> Map(moveSig -> count)
  const freq = new Map<string, Map<number, number>>();

  const parseKey = (hi?: number, lo?: number): string | null => {
    if (typeof hi !== 'number' || typeof lo !== 'number') return null;
    return `${hi >>> 0}:${lo >>> 0}`;
  };

  for (const rec of records) {
    for (const pm of rec.perMove || []) {
      const keyStr = parseKey(pm.keyHi as any, pm.keyLo as any);
      if (!keyStr) continue;
      if (typeof pm.moveSig !== 'number') continue;
      let m = freq.get(keyStr);
      if (!m) { m = new Map<number, number>(); freq.set(keyStr, m); }
      m.set(pm.moveSig >>> 0, (m.get(pm.moveSig >>> 0) ?? 0) + 1);
    }
  }

  const entries: BookEntry[] = [];
  for (const [keyStr, m] of freq.entries()) {
    let bestSig = 0;
    let bestCnt = -1;
    for (const [sig, cnt] of m.entries()) {
      if (cnt > bestCnt) { bestCnt = cnt; bestSig = sig >>> 0; }
    }
    const [hiStr, loStr] = keyStr.split(':');
    const keyHi = Number(hiStr) >>> 0;
    const keyLo = Number(loStr) >>> 0;
    if (bestCnt > 0) entries.push({ keyHi, keyLo, bestMove: bestSig });
  }

  return { version: new Date().toISOString(), entries };
}
