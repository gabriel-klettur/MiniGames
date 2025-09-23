import type { GameState } from '../game/types';
import { anyValidMoves, canMerge } from '../game/rules';

export type Player = 1 | 2;

function countMergePairs(state: GameState): number {
  let cnt = 0;
  const ts = state.towers;
  for (let i = 0; i < ts.length; i++) {
    for (let j = i + 1; j < ts.length; j++) {
      if (canMerge(ts[i], ts[j]) || canMerge(ts[j], ts[i])) cnt++;
    }
  }
  return cnt;
}

/**
 * Evaluación heurística para Soluna.
 * Valores positivos favorecen a `me`, negativos favorecen al rival.
 * - Terminal: si el jugador del turno actual no tiene movimientos, pierde.
 * - Heurística: favorecer menos pares mergeables cuando es turno del rival, y
 *   más pares cuando es mi turno (opciones).
 */
export function evaluate(state: GameState, me: Player): number {
  const noMoves = !anyValidMoves(state.towers);
  if (noMoves) {
    // Si no hay movimientos y es mi turno => pierdo; si es turno del rival => gano
    return state.currentPlayer === me ? Number.NEGATIVE_INFINITY / 2 : Number.POSITIVE_INFINITY / 2;
    }

  const pairs = countMergePairs(state);
  // Si es mi turno, más opciones (pares) es ligeramente mejor; si es del rival, menos opciones mejor para mí
  return state.currentPlayer === me ? pairs : -pairs;
}
