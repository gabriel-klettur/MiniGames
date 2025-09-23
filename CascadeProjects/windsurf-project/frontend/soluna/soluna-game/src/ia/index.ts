import type { GameState } from '../game/types';
import type { AIMove } from './moves';
import { bestMove as searchBestMove, type SearchStats } from './search';

export type { AIMove } from './moves';

export interface BestMoveResult {
  move: AIMove | null;
  score: number;
  pv: AIMove[];
  rootMoves: Array<{ move: AIMove; score: number }>;
  nodes: number;
  elapsedMs: number;
  nps: number;
}

export function bestMove(state: GameState, depth: number): BestMoveResult {
  const stats: SearchStats = { nodes: 0 };
  const t0 = performance.now();
  const { move, score, pv, rootMoves } = searchBestMove(state, depth, stats);
  const t1 = performance.now();
  const elapsedMs = t1 - t0;
  const nodes = stats.nodes;
  const nps = elapsedMs > 0 ? (nodes * 1000) / elapsedMs : 0;
  return { move, score, pv, rootMoves, nodes, elapsedMs, nps };
}
