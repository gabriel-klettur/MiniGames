import type { AIMove } from '../moves';
import { generateAllMoves, applyMove } from '../moves';
import type { GameState } from '../../game/types';
import { evaluate } from '../evaluate';
import { computeStateKey } from '../hash';
import { GlobalTT } from '../tt';

import type { Player, SearchOptions, SearchStats } from './types';
import { defaultOptions } from './options';
import { orderMoves } from './moveOrdering';
import { alphabeta } from './alphabeta';

/**
 * bestMove — Punto de entrada del motor de búsqueda.
 *
 * - Funde opciones con `defaultOptions`.
 * - Pide un hash move al TT para priorizar el orden en raíz.
 * - Ejecuta búsqueda con alfa-beta (posible PVS, LMR, quiescence).
 * - Soporta ventanas de aspiración con re-búsqueda si fallan.
 * - Devuelve la jugada elegida, su puntuación y la PV.
 */
export function bestMove(
  state: GameState,
  depth: number,
  stats?: SearchStats,
  options?: SearchOptions,
): { move: AIMove | null; score: number; pv: AIMove[]; rootMoves: Array<{ move: AIMove; score: number }> } {
  const me: Player = state.currentPlayer;
  const opts: Required<SearchOptions> = { ...defaultOptions, ...(options || {}) };
  const tt = opts.enableTT ? GlobalTT.get(computeStateKey(state)) : undefined;
  const ctx = { killers: new Map<number, string[]>(), history: new Map<string, number>() };
  const moves = orderMoves(
    state,
    generateAllMoves(state),
    tt?.best ?? null,
    opts.preferHashMove,
    null,
    opts.enableHistory ? ctx.history : null,
    opts.enableHistory ? state.currentPlayer : undefined,
  );
  if (moves.length === 0) return { move: null, score: evaluate(state, me), pv: [], rootMoves: [] };

  const runRootSearch = (a0: number, b0: number) => {
    let best: { move: AIMove; score: number; pv: AIMove[] } | null = null;
    let alpha = a0;
    const beta = b0;
    const rootMoves: Array<{ move: AIMove; score: number }> = [];
    for (const m of moves) {
      const nxt = applyMove(state, m);
      const res = alphabeta(nxt, Math.max(0, depth - 1), alpha, beta, me, stats, opts, 1, ctx);
      rootMoves.push({ move: m, score: res.score });
      if (!best || res.score > best.score) {
        best = { move: m, score: res.score, pv: [m, ...res.pv] };
        alpha = Math.max(alpha, opts.failSoft ? res.score : best.score);
      }
    }
    return { best, rootMoves, a: a0, b: b0 };
  };

  // Aspiration: narrow window around prevScore, fallback to full window
  let a = -Infinity;
  let b = +Infinity;
  if (opts.enableAspiration && Number.isFinite(opts.prevScore)) {
    const d = Math.max(1, opts.aspirationDelta);
    a = (opts.prevScore as number) - d;
    b = (opts.prevScore as number) + d;
  }
  let attempt = runRootSearch(a, b);
  let best = attempt.best;
  let rootMoves = attempt.rootMoves;
  if (opts.enableAspiration && best && (best.score <= a || best.score >= b)) {
    a = -Infinity; b = +Infinity;
    attempt = runRootSearch(a, b);
    best = attempt.best;
    rootMoves = attempt.rootMoves;
  }
  return { move: best?.move ?? null, score: best?.score ?? -Infinity, pv: best?.pv ?? [], rootMoves };
}
