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

function alphabeta(state: GameState, depth: number, alpha: number, beta: number, me: Player): number {
  const maximizing = state.currentPlayer === me;
  if (depth === 0) {
    return evaluate(state, me);
  }

  const moves = orderMoves(generateAllMoves(state));
  if (moves.length === 0) {
    // No legal moves; evaluate position as is
    return evaluate(state, me);
  }

  if (maximizing) {
    let value = -Infinity;
    for (const m of moves) {
      const nxt = applyMove(state, m);
      value = Math.max(value, alphabeta(nxt, depth - 1, alpha, beta, me));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  } else {
    let value = +Infinity;
    for (const m of moves) {
      const nxt = applyMove(state, m);
      value = Math.min(value, alphabeta(nxt, depth - 1, alpha, beta, me));
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return value;
  }
}

export function bestMove(state: GameState, depth: number): { move: AIMove | null; score: number } {
  const me: Player = state.currentPlayer;
  const moves = orderMoves(generateAllMoves(state));
  if (moves.length === 0) return { move: null, score: evaluate(state, me) };

  let best: AIMove | null = null;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = +Infinity;

  for (const m of moves) {
    const nxt = applyMove(state, m);
    const score = alphabeta(nxt, Math.max(0, depth - 1), alpha, beta, me);
    if (score > bestScore) {
      bestScore = score;
      best = m;
      alpha = Math.max(alpha, bestScore);
    }
  }
  return { move: best, score: bestScore };
}
