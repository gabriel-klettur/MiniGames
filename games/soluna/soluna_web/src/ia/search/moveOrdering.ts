import type { GameState } from '../../game/types';
import type { AIMove } from '../moves';
import type { Player } from './types';

/**
 * moveOrdering — Heurísticas para ordenar los movimientos antes de evaluar hijos.
 *
 * Beneficios: reduce branching efectivo de alpha-beta.
 * Criterios aplicados en orden de prioridad:
 * 1) Hash move (de TT), si se habilita preferHashMove.
 * 2) Killer moves del ply actual (si enableKillers).
 * 3) History heuristic por jugador (si enableHistory).
 * 4) Sumar alturas de torres (merge más "prometedor" primero).
 * 5) Preferir como fuente la torre más baja (libera opciones).
 */

/**
 * Devuelve una clave estable para un movimiento (normaliza merges A+B y B+A).
 */
export function moveKey(m: AIMove): string {
  if (m.kind !== 'merge') return JSON.stringify(m);
  const a = m.sourceId < m.targetId ? m.sourceId : m.targetId;
  const b = m.sourceId < m.targetId ? m.targetId : m.sourceId;
  return `${a}+${b}`;
}

/**
 * Ordena una lista de movimientos según heurísticas combinadas.
 */
export function orderMoves(
  state: GameState,
  moves: AIMove[],
  preferred?: AIMove | null,
  preferHashMove: boolean = true,
  killersAtPly?: Set<string> | null,
  history?: Map<string, number> | null,
  historyPlayer?: Player,
): AIMove[] {
  const byId: Record<string, { height: number }> = Object.fromEntries(
    state.towers.map((t) => [t.id, { height: t.height }])
  );
  const prefKey = preferred ? moveKey(preferred) : null;
  return moves
    .slice()
    .sort((a, b) => {
      // 0) Hash move primero (si está habilitado)
      if (preferHashMove && prefKey) {
        const ak = moveKey(a) === prefKey;
        const bk = moveKey(b) === prefKey;
        if (ak !== bk) return ak ? -1 : 1;
      }
      // 1) Killers de este ply
      if (killersAtPly && killersAtPly.size > 0) {
        const ak = killersAtPly.has(moveKey(a));
        const bk = killersAtPly.has(moveKey(b));
        if (ak !== bk) return ak ? -1 : 1;
      }
      // 2) History heuristic por jugador
      if (history && historyPlayer) {
        const pa = history.get(`${historyPlayer}:${moveKey(a)}`) || 0;
        const pb = history.get(`${historyPlayer}:${moveKey(b)}`) || 0;
        if (pa !== pb) return pb - pa; // mayor score primero
      }
      // 3) Merge que crea mayor altura combinada primero
      const ah = (byId[a.sourceId]?.height ?? 0) + (byId[a.targetId]?.height ?? 0);
      const bh = (byId[b.sourceId]?.height ?? 0) + (byId[b.targetId]?.height ?? 0);
      if (ah !== bh) return bh - ah;
      // 4) Pequeña preferencia por usar como fuente la torre más baja
      const asrc = byId[a.sourceId]?.height ?? 0;
      const bsrc = byId[b.sourceId]?.height ?? 0;
      if (asrc !== bsrc) return asrc - bsrc;
      return 0;
    });
}
