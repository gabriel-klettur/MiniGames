import { useMemo } from 'react';
import type { MoveLike } from '../utils/format';

export interface RootMoveLike {
  move: MoveLike;
  score: number;
}

export interface SortedRootMovesResult {
  items: RootMoveLike[];
  maxAbs: number; // maximum absolute score across items (0 if none)
}

/**
 * Sorts root moves by descending score and caps the list to `limit` (default 6).
 * Also computes the maximum absolute score to help compute UI bar ratios.
 */
export function useSortedRootMoves(rootMoves: RootMoveLike[] | undefined, limit: number = 6): SortedRootMovesResult {
  return useMemo(() => {
    const src = Array.isArray(rootMoves) ? rootMoves : [];
    const items = src
      .slice()
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .slice(0, Math.max(0, limit | 0));
    const maxAbs = items.length > 0 ? Math.max(...items.map(r => Math.abs(r.score))) : 0;
    return { items, maxAbs };
  }, [rootMoves, limit]);
}

export default useSortedRootMoves;

