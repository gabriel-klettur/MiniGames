import type { GameState } from '../../game/types';
import type { AIMove } from '../moves';
import { generateAllMoves, applyMove } from '../moves';
import { evaluate } from '../evaluate';
import { computeStateKey } from '../hash';
import { GlobalTT, type TTEntry } from '../tt';

import type { Player, SearchOptions, SearchStats, SearchResult, SearchContext } from './types';
import { orderMoves, moveKey } from './moveOrdering';
import { isTactical } from './tactics';
import { quiescence } from './quiescence';

/**
 * alphabeta — Búsqueda alfa-beta con heurísticas avanzadas:
 * - TT (transposition table) con flags EXACT/LOWER/UPPER.
 * - Fail-soft: actualiza límites con puntajes de hijos.
 * - PVS: primera jugada evalúa ventana completa; siguientes con null-window y re-búsqueda si es necesario.
 * - LMR: reduce profundidad en jugadas tardías no tácticas ni killers.
 * - Killers e History: aprendizaje ligero para ordenar mejor y cortar antes.
 * - Quiescence opcional al alcanzar profundidad 0.
 */
export function alphabeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  me: Player,
  stats: SearchStats | undefined,
  opts: Required<SearchOptions>,
  ply: number,
  ctx: SearchContext,
): SearchResult {
  if (stats) stats.nodes++;
  const maximizing = state.currentPlayer === me;
  if (depth === 0) {
    if (opts.enableQuiescence && opts.quiescenceDepth > 0) {
      return quiescence(state, alpha, beta, me, stats, opts, ply, ctx, opts.quiescenceDepth);
    }
    return { score: evaluate(state, me), pv: [] };
  }

  // TT probe (fail-soft compatible)
  const key = computeStateKey(state);
  const tt = opts.enableTT ? GlobalTT.get(key) : undefined;
  const alphaOrig = alpha;
  const betaOrig = beta;
  let hashMove: AIMove | null = null;
  if (tt && tt.depth >= depth) {
    if (tt.flag === 'EXACT') {
      return { score: tt.value, pv: [] };
    } else if (tt.flag === 'LOWER') {
      alpha = Math.max(alpha, tt.value);
    } else if (tt.flag === 'UPPER') {
      beta = Math.min(beta, tt.value);
    }
    if (alpha >= beta) {
      return { score: tt.value, pv: [] };
    }
    if (tt.best) hashMove = tt.best;
  }

  // Generate and order moves with heuristics
  const killersArr = ctx.killers.get(ply) || [];
  const killersSet = killersArr.length ? new Set(killersArr) : null;
  const moves = orderMoves(
    state,
    generateAllMoves(state),
    hashMove,
    opts.preferHashMove,
    opts.enableKillers ? killersSet : null,
    opts.enableHistory ? ctx.history : null,
    opts.enableHistory ? state.currentPlayer : undefined,
  );
  if (moves.length === 0) {
    return { score: evaluate(state, me), pv: [] };
  }

  if (maximizing) {
    let bestScore = -Infinity;
    let bestPV: AIMove[] = [];
    let bestMv: AIMove | undefined = undefined;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      const nxt = applyMove(state, m);
      let child: SearchResult;
      if (opts.enablePVS && i > 0 && depth > 1) {
        // Null-window search first
        child = alphabeta(nxt, depth - 1, alpha, alpha + 1, me, stats, opts, ply + 1, ctx);
        // Re-search full window if inside
        if (child.score > alpha && child.score < beta) {
          child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
        }
      } else {
        // LMR for late, non-tactical, non-killer moves
        const canLMR = opts.enableLMR && depth >= (opts.lmrMinDepth) && i >= (opts.lmrLateMoveIdx || 0);
        if (canLMR) {
          const tactical = isTactical(state, m, opts.quiescenceHighTowerThreshold);
          const killersAtPly = ctx.killers.get(ply) || [];
          const isKiller = killersAtPly.includes(moveKey(m));
          if (!tactical && !isKiller) {
            const reduced = Math.max(1, (depth - 1) - (opts.lmrReduction || 1));
            child = alphabeta(nxt, reduced, alpha, beta, me, stats, opts, ply + 1, ctx);
            if (child.score > alpha) {
              child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
            }
          } else {
            child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
          }
        } else {
          child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
        }
      }
      if (child.score > bestScore) {
        bestScore = child.score;
        bestPV = [m, ...child.pv];
        bestMv = m;
      }
      // Fail-soft window update
      alpha = Math.max(alpha, opts.failSoft ? child.score : bestScore);
      if (alpha >= beta) {
        // Killer and History updates on cutoff
        if (opts.enableKillers && bestMv) {
          const mk = moveKey(bestMv);
          const arr = ctx.killers.get(ply) || [];
          if (!arr.includes(mk)) arr.unshift(mk);
          if (arr.length > 2) arr.length = 2;
          ctx.killers.set(ply, arr);
        }
        if (opts.enableHistory && bestMv) {
          const mk = moveKey(bestMv);
          const keyH = `${state.currentPlayer}:${mk}`;
          const bonus = depth * depth;
          ctx.history.set(keyH, (ctx.history.get(keyH) || 0) + bonus);
        }
        break;
      }
    }
    // Store TT
    if (opts.enableTT && bestMv !== undefined) {
      const entry: TTEntry = {
        key,
        depth,
        value: bestScore,
        flag: bestScore <= alphaOrig ? 'UPPER' : bestScore >= betaOrig ? 'LOWER' : 'EXACT',
        best: bestMv,
      };
      GlobalTT.set(entry);
    }
    return { score: bestScore, pv: bestPV };
  } else {
    let bestScore = +Infinity;
    let bestPV: AIMove[] = [];
    let bestMv: AIMove | undefined = undefined;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      const nxt = applyMove(state, m);
      let child: SearchResult;
      if (opts.enablePVS && i > 0 && depth > 1) {
        // Null-window for minimizing side: [beta-1, beta]
        child = alphabeta(nxt, depth - 1, beta - 1, beta, me, stats, opts, ply + 1, ctx);
        if (child.score < beta && child.score > alpha) {
          child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
        }
      } else {
        const canLMR = opts.enableLMR && depth >= (opts.lmrMinDepth) && i >= (opts.lmrLateMoveIdx || 0);
        if (canLMR) {
          const tactical = isTactical(state, m, opts.quiescenceHighTowerThreshold);
          const killersAtPly = ctx.killers.get(ply) || [];
          const isKiller = killersAtPly.includes(moveKey(m));
          if (!tactical && !isKiller) {
            const reduced = Math.max(1, (depth - 1) - (opts.lmrReduction || 1));
            child = alphabeta(nxt, reduced, alpha, beta, me, stats, opts, ply + 1, ctx);
            if (child.score < beta) {
              child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
            }
          } else {
            child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
          }
        } else {
          child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
        }
      }
      if (child.score < bestScore) {
        bestScore = child.score;
        bestPV = [m, ...child.pv];
        bestMv = m;
      }
      beta = Math.min(beta, opts.failSoft ? child.score : bestScore);
      if (alpha >= beta) {
        if (opts.enableKillers && bestMv) {
          const mk = moveKey(bestMv);
          const arr = ctx.killers.get(ply) || [];
          if (!arr.includes(mk)) arr.unshift(mk);
          if (arr.length > 2) arr.length = 2;
          ctx.killers.set(ply, arr);
        }
        if (opts.enableHistory && bestMv) {
          const mk = moveKey(bestMv);
          const keyH = `${state.currentPlayer}:${mk}`;
          const bonus = depth * depth;
          ctx.history.set(keyH, (ctx.history.get(keyH) || 0) + bonus);
        }
        break;
      }
    }
    if (opts.enableTT && bestMv !== undefined) {
      const entry: TTEntry = {
        key,
        depth,
        value: bestScore,
        flag: bestScore <= alphaOrig ? 'UPPER' : bestScore >= betaOrig ? 'LOWER' : 'EXACT',
        best: bestMv,
      };
      GlobalTT.set(entry);
    }
    return { score: bestScore, pv: bestPV };
  }
}
