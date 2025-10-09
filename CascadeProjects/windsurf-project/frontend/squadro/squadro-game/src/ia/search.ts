import type { GameState } from '../game/types';
import { bestMoveIterative } from './search/index';
import type { SearchStats, EngineOptions } from './search/types';

export type BestMove = { moveId: string | null; score: number; depthReached: number; engineStats?: Partial<SearchStats> };

export type SearchEvent =
  | { type: 'start'; startedAt: number }
  | { type: 'progress'; nodesVisited: number }
  | { type: 'iter'; depth: number; score: number; bestMove: string | null }
  | { type: 'end'; durationMs: number; depthReached: number; score: number; nodesVisited: number };

export interface SearchOptions {
  maxDepth: number; // 1..N
  timeLimitMs: number; // wall clock budget
  onProgress?: (ev: SearchEvent) => void; // optional hooks for instrumentation
  // Optional: restrict root node to a subset of move IDs (for parallelization)
  rootMoves?: string[];
  // Optional: engine options (toggles/params)
  engine?: EngineOptions;
}

export async function findBestMove(rootState: GameState, opts: SearchOptions): Promise<BestMove> {
  const stats = { nodes: 0 };
  const allowed = opts.rootMoves ? new Set(opts.rootMoves) : undefined;
  const engineDefaults: EngineOptions = {
    enableTT: true,
    enableKillers: true,
    enableHistory: true,
    enablePVS: true,
    enableLMR: true,
    lmrMinDepth: 3,
    lmrLateMoveIdx: 3,
    lmrReduction: 1,
  };

  const res = bestMoveIterative(rootState, {
    maxDepth: opts.maxDepth,
    timeLimitMs: opts.timeLimitMs,
    allowedRootMoves: allowed,
    onProgress: (ev: any) => {
      if (ev.type === 'start') {
        opts.onProgress?.({ type: 'start', startedAt: ev.startedAt });
      } else if (ev.type === 'progress') {
        opts.onProgress?.({ type: 'progress', nodesVisited: ev.nodesVisited });
      } else if (ev.type === 'iter') {
        opts.onProgress?.({ type: 'iter', depth: ev.depth, score: ev.score, bestMove: ev.bestMove ?? null });
      } else if (ev.type === 'end') {
        opts.onProgress?.({
          type: 'end',
          durationMs: ev.durationMs,
          depthReached: ev.depthReached,
          score: ev.score,
          nodesVisited: ev.nodesVisited,
        });
      }
    },
    engine: { ...engineDefaults, ...(opts.engine || {}) },
  }, stats);
  // Yield back to UI microtask queue to keep compatibility with previous async behavior
  await new Promise((r) => setTimeout(r, 0));
  return { moveId: res.moveId, score: res.score, depthReached: res.depthReached, engineStats: { ...stats } };
}
