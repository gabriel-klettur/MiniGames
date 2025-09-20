import type { GameState, Player } from '../game/types';
import { generateAllMoves, applyMove } from './moves';
import type { AIMove } from './moves';
import { evaluate } from './evaluate';

function orderMoves(moves: AIMove[]): AIMove[] {
  return moves
    .slice()
    .sort((a, b) => {
      // Prioridad heurística de ordenamiento:
      // 1) Más recuperaciones primero (2 > 1 > 0)
      const ra = (a.recovers?.length ?? 0);
      const rb = (b.recovers?.length ?? 0);
      if (ra !== rb) return rb - ra;
      // 2) Movimientos a niveles superiores primero
      const la = a.kind === 'place' ? a.dest.level : a.dest.level;
      const lb = b.kind === 'place' ? b.dest.level : b.dest.level;
      if (la !== lb) return lb - la;
      // 3) Preferir elevar sobre colocar (libera reservas)
      if (a.kind !== b.kind) return a.kind === 'lift' ? -1 : 1;
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

  const moves = orderMoves(generateAllMoves(state));
  if (moves.length === 0) {
    // No legal moves; evaluate position as is
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
  const moves = orderMoves(generateAllMoves(state));
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
