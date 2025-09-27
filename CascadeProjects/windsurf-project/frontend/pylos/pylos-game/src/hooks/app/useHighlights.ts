import { useMemo } from 'react';
import type { GameState } from '../../game/types';
import { posKey } from '../../game/board';
import { recoverablePositions, validMoveDestinations, validReserveDestinations } from '../../game/rules';

/**
 * Derives the set of highlighted destination keys for the current phase.
 */
export function useHighlights(state: GameState, gameOver: string | undefined): Set<string> {
  return useMemo(() => {
    if (gameOver) return new Set();
    if (state.phase === 'recover' && state.recovery) {
      return new Set(recoverablePositions(state.board, state.recovery.player).map(posKey));
    }
    if (state.phase === 'selectMoveDest' && state.selectedSource) {
      return new Set(validMoveDestinations(state.board, state.selectedSource).map(posKey));
    }
    if (state.phase === 'play') {
      return new Set(validReserveDestinations(state.board).map(posKey));
    }
    return new Set();
  }, [state, gameOver]);
}
