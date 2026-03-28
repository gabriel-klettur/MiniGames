import type { GameState } from '../../game/types';
import type { AIMove } from '../moves';
import { generateAllMoves, applyMove } from '../moves';
import { evaluate } from '../evaluate';
import type { Player, SearchOptions, SearchStats, SearchResult, SearchContext } from './types';
import { orderMoves } from './moveOrdering';
import { isTactical } from './tactics';

/**
 * quiescence — Extiende hojas sólo a través de movimientos tácticos para
 * estabilizar la evaluación (evitar horizon effects). Usa stand-pat como
 * baseline y aplica fail-soft en la ventana.
 */
export function quiescence(
  state: GameState,
  alpha: number,
  beta: number,
  me: Player,
  stats: SearchStats | undefined,
  opts: Required<SearchOptions>,
  ply: number,
  ctx: SearchContext,
  qdepth: number,
): SearchResult {
  if (stats) stats.nodes++;
  const standPat = evaluate(state, me);
  // Fail-soft boundaries
  if (standPat >= beta) return { score: standPat, pv: [] };
  let a = Math.max(alpha, standPat);

  if (qdepth <= 0) return { score: a, pv: [] };

  // Generate only tactical moves to extend
  const all = generateAllMoves(state);
  const tactical = all.filter((m) => isTactical(state, m, opts.quiescenceHighTowerThreshold));
  if (tactical.length === 0) return { score: a, pv: [] };

  const ordered = orderMoves(
    state,
    tactical,
    undefined,
    opts.preferHashMove,
    null,
    null,
    undefined,
  );

  const maximizing = state.currentPlayer === me;
  if (maximizing) {
    let bestScore = -Infinity;
    let bestPV: AIMove[] = [];
    for (const m of ordered) {
      const nxt = applyMove(state, m);
      const child = quiescence(nxt, a, beta, me, stats, opts, ply + 1, ctx, qdepth - 1);
      if (child.score > bestScore) {
        bestScore = child.score;
        bestPV = [m, ...child.pv];
      }
      a = Math.max(a, opts.failSoft ? child.score : bestScore);
      if (a >= beta) break;
    }
    return { score: Math.max(standPat, bestScore), pv: bestPV };
  } else {
    let bestScore = +Infinity;
    let bestPV: AIMove[] = [];
    for (const m of ordered) {
      const nxt = applyMove(state, m);
      const child = quiescence(nxt, alpha, a, me, stats, opts, ply + 1, ctx, qdepth - 1);
      if (child.score < bestScore) {
        bestScore = child.score;
        bestPV = [m, ...child.pv];
      }
      a = Math.min(beta, opts.failSoft ? child.score : bestScore);
      if (alpha >= a) break;
    }
    return { score: Math.min(standPat, bestScore), pv: bestPV };
  }
}
