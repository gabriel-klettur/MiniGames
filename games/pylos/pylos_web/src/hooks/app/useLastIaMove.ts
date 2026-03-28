import { useMemo } from 'react';
import type { MoveEntry } from '../usePersistence';

/**
 * Returns the side ('L' | 'D') of the last move made by the AI, or null.
 */
export function useLastIaMove(moves: MoveEntry[]): 'L' | 'D' | null {
  return useMemo(() => {
    for (let i = moves.length - 1; i >= 0; i--) {
      if (moves[i].source === 'IA') return moves[i].player;
    }
    return null;
  }, [moves]);
}
