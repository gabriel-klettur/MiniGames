import type { GameState } from '../../game/types';
import type { FlyingPieceState } from '../useAnimations';

/**
 * Returns the reserves to display, using the pending state's reserves during a flying animation.
 */
export function useReservesDisplay(
  state: GameState,
  flying: FlyingPieceState | null,
  pendingState: GameState | null
): GameState['reserves'] {
  return flying && pendingState ? pendingState.reserves : state.reserves;
}
