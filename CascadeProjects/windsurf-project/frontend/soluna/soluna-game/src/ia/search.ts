import type { GameState } from '../game/types';
import type { AIMove } from './moves';
import { generateAllMoves, applyMove } from './moves';
import { evaluate } from './evaluate';

export type Player = 1 | 2;

function orderMoves(state: GameState, moves: AIMove[]): AIMove[] {
  // Heurística simple de ordenamiento:
  // - Preferir merges que produzcan torres más altas
  // - Si los heights son iguales (o mismo top), mantener orden estable
  const byId: Record<string, { height: number }> = Object.fromEntries(
    state.towers.map((t) => [t.id, { height: t.height }])
  );
  return moves
    .slice()
    .sort((a, b) => {
      const ah = (byId[a.sourceId]?.height ?? 0) + (byId[a.targetId]?.height ?? 0);
      const bh = (byId[b.sourceId]?.height ?? 0) + (byId[b.targetId]?.height ?? 0);
      if (ah !== bh) return bh - ah;
      // Pequeña preferencia por usar como fuente la torre más baja (libera opciones)
      const asrc = byId[a.sourceId]?.height ?? 0;
      const bsrc = byId[b.sourceId]?.height ?? 0;
      if (asrc !== bsrc) return asrc - bsrc;
      return 0;
    });
}

export interface SearchStats { nodes: number }
export interface SearchResult { score: number; pv: AIMove[] }

function alphabeta(state: GameState, depth: number, alpha: number, beta: number, me: Player, stats?: SearchStats): SearchResult {
  if (stats) stats.nodes++;
  const maximizing = state.currentPlayer === me;
  if (depth === 0) {
    return { score: evaluate(state, me), pv: [] };
  }

  const moves = orderMoves(state, generateAllMoves(state));
  if (moves.length === 0) {
    return { score: evaluate(state, me), pv: [] };
  }

  if (maximizing) {
    let best: SearchResult | null = null;
    for (const m of moves) {
      const nxt = applyMove(state, m);
      const child = alphabeta(nxt, depth - 1, alpha, beta, me, stats);
      if (!best || child.score > best.score) {
        best = { score: child.score, pv: [m, ...child.pv] };
      }
      alpha = Math.max(alpha, best!.score);
      if (alpha >= beta) break;
    }
    return best ?? { score: -Infinity, pv: [] };
  } else {
    let best: SearchResult | null = null;
    for (const m of moves) {
      const nxt = applyMove(state, m);
      const child = alphabeta(nxt, depth - 1, alpha, beta, me, stats);
      if (!best || child.score < best.score) {
        best = { score: child.score, pv: [m, ...child.pv] };
      }
      beta = Math.min(beta, best!.score);
      if (alpha >= beta) break;
    }
    return best ?? { score: +Infinity, pv: [] };
  }
}

export function bestMove(state: GameState, depth: number, stats?: SearchStats): { move: AIMove | null; score: number; pv: AIMove[]; rootMoves: Array<{ move: AIMove; score: number }> } {
  const me: Player = state.currentPlayer;
  const moves = orderMoves(state, generateAllMoves(state));
  if (moves.length === 0) return { move: null, score: evaluate(state, me), pv: [], rootMoves: [] };

  let best: { move: AIMove; score: number; pv: AIMove[] } | null = null;
  let alpha = -Infinity;
  const beta = +Infinity;
  const rootMoves: Array<{ move: AIMove; score: number }> = [];

  for (const m of moves) {
    const nxt = applyMove(state, m);
    const res = alphabeta(nxt, Math.max(0, depth - 1), alpha, beta, me, stats);
    rootMoves.push({ move: m, score: res.score });
    if (!best || res.score > best.score) {
      best = { move: m, score: res.score, pv: [m, ...res.pv] };
      alpha = Math.max(alpha, best.score);
    }
  }
  return { move: best?.move ?? null, score: best?.score ?? -Infinity, pv: best?.pv ?? [], rootMoves };
}
