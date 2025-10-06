/* eslint-disable no-restricted-globals */
import type { GameState } from '../../game/types';
import { bestMove, defaultOptions, type SearchOptions, type Player, type SearchStats, type SearchContext } from '../search/search';
import { alphabeta } from '../search/alphabeta';
import { applyMove, type AIMove } from '../moves';
import { clearGlobalTT } from '../tt';
import { computeAdaptiveTimeBudget } from '../time';

// Messages from main thread
// { type: 'SEARCH', state, depth?: number, timeMs?: number, options?: SearchOptions }
// { type: 'CANCEL' }
// { type: 'RESET_TT' }
// { type: 'SEARCH_SUBTREE', state, move, depth, alpha, beta, options?, jobId? }

let aborted = false;

self.onmessage = (e: MessageEvent) => {
  const data = e.data || {};
  const { type } = data;
  if (type === 'CANCEL') {
    aborted = true;
    return;
  }
  if (type === 'RESET_TT') {
    try { clearGlobalTT(); } catch {}
    return;
  }
  if (type === 'SEARCH_SUBTREE') {
    // Depth-limited subtree search for a single root move
    try {
      const state: GameState = data.state;
      const move: AIMove = data.move;
      const depth: number = Math.max(0, Math.floor(data.depth ?? 0));
      const alpha: number = typeof data.alpha === 'number' ? data.alpha : -Infinity;
      const beta: number = typeof data.beta === 'number' ? data.beta : +Infinity;
      const options: SearchOptions | undefined = data.options;
      const jobId: number | undefined = typeof data.jobId === 'number' ? data.jobId : undefined;
      const me: Player = state.currentPlayer as Player;
      const opts = { ...defaultOptions, ...(options || {}) } as Required<SearchOptions>;
      const ctx: SearchContext = { killers: new Map(), history: new Map() };
      const stats: SearchStats = { nodes: 0 };
      const nxt = applyMove(state, move);
      const res = alphabeta(nxt, Math.max(0, depth - 1), alpha, beta, me, stats, opts, 1, ctx);
      // @ts-ignore
      self.postMessage({ type: 'SUBTREE_RESULT', jobId, move, score: res.score, pv: [move, ...res.pv], nodes: stats.nodes, ttProbes: stats.ttProbes || 0, ttHits: stats.ttHits || 0, cutoffs: stats.cutoffs || 0, pvsReSearches: stats.pvsReSearches || 0, lmrReductions: stats.lmrReductions || 0 });
    } catch (err) {
      // @ts-ignore
      self.postMessage({ type: 'SUBTREE_RESULT', error: String(err && (err as any).message || err) });
    }
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
  let ttProbes = 0;
  let ttHits = 0;
  let cutoffs = 0;
  let pvsReSearches = 0;
  let lmrReductions = 0;
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
    ttProbes += stats.ttProbes || 0;
    ttHits += stats.ttHits || 0;
    cutoffs += stats.cutoffs || 0;
    pvsReSearches += stats.pvsReSearches || 0;
    lmrReductions += stats.lmrReductions || 0;
    if (cur.move !== null) {
      best = cur as any;
      reached = d;
      prevScore = cur.score;
      // Post progress to UI
      // @ts-ignore
      self.postMessage({ type: 'PROGRESS', searchId, depth: d, score: cur.score, nodes, ttProbes, ttHits, cutoffs, pvsReSearches, lmrReductions });
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
  self.postMessage({ type: 'RESULT', searchId, bestMove: best.move, score: best.score, depthReached: reached, pv: best.pv ?? [], rootMoves: best.rootMoves ?? [], nodes, elapsedMs, nps, ttProbes, ttHits, cutoffs, pvsReSearches, lmrReductions });
};
