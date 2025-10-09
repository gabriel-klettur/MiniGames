import type { GameState, Player } from '../../game/types';
import { orderMoves } from '../moves';

export interface OrderingHints {
  hashMove?: string | null;
  killers?: string[];
  history?: Map<string, number>;
}

export function orderedMoves(
  gs: GameState,
  moves: string[],
  me: Player,
  hints?: OrderingHints,
): string[] {
  return orderMoves(gs, moves, me, hints);
}
