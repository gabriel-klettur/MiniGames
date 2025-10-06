/* eslint-disable no-restricted-globals */
import type { GameState } from '../../game/types';
import { bestMove, type SearchOptions } from '../search/search';
import type { SearchStats } from '../search/search';
import { clearGlobalTT } from '../tt';
import { computeAdaptiveTimeBudget } from '../time';

// Messages from main thread
// { type: 'SEARCH', state, depth?: number, timeMs?: number, options?: SearchOptions }
// { type: 'CANCEL' }

let aborted = false;

self.onmessage = (e: MessageEvent) => {
  const data = e.data || {};
  const { type } = data;
  if (type === 'CANCEL') {
    aborted = true;
    return;
  }
  if (type !== 'SEARCH') return;

  aborted = false;
  // Reset TT for a new top-level search; reused across iterative deepening depths
  clearGlobalTT();
  const state: GameState = data.state;
  const depthMax: number = Math.max(1, Math.min(10, Math.floor(data.depth ?? 3)));
  const timeMs: number | undefined = typeof data.timeMs === 'number' ? Math.max(50, data.timeMs) : undefined;
  const searchId: number | undefined = typeof data.searchId === 'number' ? data.searchId : undefined;
  const options: SearchOptions | undefined = data.options;
  const adaptiveTimeConfig: any | undefined = (data && typeof data.adaptiveTimeConfig === 'object') ? data.adaptiveTimeConfig : undefined;

  const start = performance.now();
  let best: { move: any; score: number; pv: any[]; rootMoves: Array<{ move: any; score: number }> } = { move: null, score: -Infinity, pv: [], rootMoves: [] };
  let reached = 0;
  let nodes = 0;
  // If time not provided (auto mode), compute adaptive budget from root branching factor
  const effectiveTimeMs: number | undefined =
    timeMs !== undefined ? timeMs : computeAdaptiveTimeBudget(state, adaptiveTimeConfig);

  let prevScore: number | undefined = undefined;
  for (let d = 1; d <= depthMax; d++) {
    if (aborted) return;
    const stats: SearchStats = { nodes: 0 };
    const cur = bestMove(
      state,
      d,
      stats,
      options && options.enableAspiration
        ? { ...options, prevScore }
        : options
    );
    nodes += stats.nodes;
    if (cur.move !== null) {
      best = cur as any;
      reached = d;
      prevScore = cur.score;
      // Post progress to UI
      // @ts-ignore
      self.postMessage({ type: 'PROGRESS', searchId, depth: d, score: cur.score, nodes });
    }
    if (effectiveTimeMs !== undefined) {
      const elapsed = performance.now() - start;
      if (elapsed >= effectiveTimeMs) break;
    }
  }

  if (aborted) return;
  const elapsedMs = performance.now() - start;
  const nps = elapsedMs > 0 ? (nodes * 1000) / elapsedMs : nodes;
  // @ts-ignore
  self.postMessage({ type: 'RESULT', searchId, bestMove: best.move, score: best.score, depthReached: reached, pv: best.pv ?? [], rootMoves: best.rootMoves ?? [], nodes, elapsedMs, nps });
};
