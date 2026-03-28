import { useMemo } from 'react';
import type { AIMove } from '../../../../ia/index';
import { sortRootMovesTopN } from '../utils/sort';

export type RootMove = { move: AIMove; score: number };

/**
 * Returns the top N root moves sorted by descending score. Caps to 6
 * to match the original UI behavior.
 */
export function useRootSorted(rootMoves?: RootMove[], cap: number = 6): RootMove[] {
  return useMemo(() => sortRootMovesTopN(rootMoves, cap), [rootMoves, cap]);
}
