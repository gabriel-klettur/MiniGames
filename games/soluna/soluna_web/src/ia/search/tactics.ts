import type { GameState } from '../../game/types';
import type { AIMove } from '../moves';
import { applyMove } from '../moves';

/**
 * isTactical — Determina si un movimiento merece extensión táctica.
 *
 * Criterios:
 * 1) Si el movimiento termina la ronda inmediatamente (roundOver), es táctico.
 * 2) Si es un merge cuya suma de alturas (fuente+destino) supera el umbral, es táctico.
 *
 * Esto es usado tanto por LMR (para no reducir tácticos) como por quiescence
 * (para extender sólo posiciones con táctica pendiente y estabilizar la evaluación).
 */
export function isTactical(state: GameState, m: AIMove, highTowerThreshold: number): boolean {
  const nxt = applyMove(state, m);
  if (nxt.roundOver) return true;
  if (m.kind === 'merge') {
    let srcH = 0;
    let tgtH = 0;
    for (let i = 0; i < state.towers.length; i++) {
      const t = state.towers[i];
      if (t.id === m.sourceId) srcH = t.height;
      else if (t.id === m.targetId) tgtH = t.height;
      if (srcH && tgtH) break;
    }
    if (srcH + tgtH >= highTowerThreshold) return true;
  }
  return false;
}
