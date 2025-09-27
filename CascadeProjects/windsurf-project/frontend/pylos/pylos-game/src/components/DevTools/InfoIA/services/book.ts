import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';

export type BookEntry = { keyHi: number; keyLo: number; bestMove: number };
export type OpeningBook = { version: string; entries: BookEntry[] };

export type BuildBookOptions = {
  // Optional logical phase filter by ply index range
  phase?: 'aperturas' | 'medio' | 'cierres';
  // Optional difficulty filter by record.depth
  difficulty?: 'facil' | 'medio' | 'dificil';
  // Minimum support percentage for the chosen best move within each key (0..100)
  minSupportPct?: number;
};

function plyRangeForPhase(phase: 'aperturas' | 'medio' | 'cierres'): { lo: number; hi: number } {
  // Inclusive ranges in ply indices (0-based)
  if (phase === 'aperturas') return { lo: 0, hi: 12 };
  if (phase === 'medio') return { lo: 13, hi: 40 };
  return { lo: 41, hi: Number.POSITIVE_INFINITY };
}

function depthRangeForDifficulty(d: 'facil' | 'medio' | 'dificil'): { lo: number; hi: number } {
  if (d === 'facil') return { lo: 1, hi: 3 };
  if (d === 'medio') return { lo: 4, hi: 7 };
  return { lo: 8, hi: 10 };
}

/** Build an opening book from InfoIA records by picking the most frequent moveSig per Zobrist key.
 * Options allow filtering by phase (plies) and difficulty, plus a minimum support threshold.
 */
export function buildOpeningBook(records: InfoIAGameRecord[], opts: BuildBookOptions = {}): OpeningBook {
  const phase = opts.phase;
  const minSupportPct = Math.max(0, Math.min(100, Math.floor(opts.minSupportPct ?? 0)));

  const depthFilter = opts.difficulty ? depthRangeForDifficulty(opts.difficulty) : null;
  const plyFilter = phase ? plyRangeForPhase(phase) : null;

  type Agg = {
    // per move signature counts
    counts: Map<number, number>;
    // per move signature cumulative score (for tie-break)
    scoreSum: Map<number, number>;
    total: number;
  };
  // Map key ("hi:lo") -> Agg
  const agg = new Map<string, Agg>();

  const parseKey = (hi?: number, lo?: number): string | null => {
    if (typeof hi !== 'number' || typeof lo !== 'number') return null;
    return `${hi >>> 0}:${lo >>> 0}`;
  };

  for (const rec of records) {
    // Optional filter by difficulty via record.depth
    if (depthFilter) {
      const d = Math.floor(rec.depth || 0);
      if (!(d >= depthFilter.lo && d <= depthFilter.hi)) continue;
    }
    const moves = rec.perMove || [];
    for (let i = 0; i < moves.length; i++) {
      // Optional filter by phase via ply index
      if (plyFilter) {
        if (!(i >= plyFilter.lo && i <= plyFilter.hi)) continue;
      }
      const pm = moves[i];
      const keyStr = parseKey(pm.keyHi as any, pm.keyLo as any);
      if (!keyStr) continue;
      if (typeof pm.moveSig !== 'number') continue;
      let a = agg.get(keyStr);
      if (!a) { a = { counts: new Map(), scoreSum: new Map(), total: 0 }; agg.set(keyStr, a); }
      const sig = pm.moveSig >>> 0;
      a.counts.set(sig, (a.counts.get(sig) ?? 0) + 1);
      if (typeof pm.score === 'number' && Number.isFinite(pm.score)) {
        a.scoreSum.set(sig, (a.scoreSum.get(sig) ?? 0) + Number(pm.score));
      }
      a.total++;
    }
  }

  const entries: BookEntry[] = [];
  for (const [keyStr, a] of agg.entries()) {
    if (a.total <= 0) continue;
    // Pick the move with highest count; tie-break by higher average score
    let bestSig = 0;
    let bestCnt = -1;
    let bestAvgScore = -Infinity;
    for (const [sig, cnt] of a.counts.entries()) {
      const sum = a.scoreSum.get(sig) ?? 0;
      const avg = cnt > 0 ? (sum / cnt) : 0;
      if (cnt > bestCnt || (cnt === bestCnt && avg > bestAvgScore)) {
        bestCnt = cnt; bestSig = sig >>> 0; bestAvgScore = avg;
      }
    }
    // Apply minimum support threshold if requested
    if (minSupportPct > 0) {
      const pct = (bestCnt * 100) / a.total;
      if (pct < minSupportPct) continue;
    }
    const [hiStr, loStr] = keyStr.split(':');
    const keyHi = Number(hiStr) >>> 0;
    const keyLo = Number(loStr) >>> 0;
    if (bestCnt > 0) entries.push({ keyHi, keyLo, bestMove: bestSig });
  }

  const meta = [opts.difficulty, phase, new Date().toISOString()].filter(Boolean).join(' | ');
  return { version: meta, entries };
}
