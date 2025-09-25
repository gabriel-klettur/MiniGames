/* eslint-disable no-restricted-globals */
import type { GameState } from '../../game/types';
import { bestMove, setSearchConfig } from '../search/search';
import type { SearchStats } from '../search/search';
import { probeBook, setBookUrl } from '../book.ts';
import { TT } from '../tt';

// Messages from main thread
// { type: 'SEARCH', state, depth?: number, timeMs?: number }
// { type: 'CANCEL' }

let aborted = false;

self.onmessage = async (e: MessageEvent) => {
  const data = e.data || {};
  const { type } = data;
  if (type === 'CANCEL') {
    aborted = true;
    return;
  }
  if (type !== 'SEARCH') return;

  aborted = false;
  const state: GameState = data.state;
  const depthMax: number = Math.max(1, Math.min(10, Math.floor(data.depth ?? 3)));
  const timeMs: number | undefined = typeof data.timeMs === 'number' ? Math.max(50, data.timeMs) : undefined;
  // Optional AI configuration
  const cfg = (data.cfg || {}) as { search?: Partial<{ qDepthMax: number; qNodeCap: number; futilityMargin: number; quiescence: boolean }>; bookEnabled?: boolean; bookUrl?: string };
  try { setSearchConfig(cfg.search || {}); } catch {}
  try { if (cfg.bookUrl) setBookUrl(cfg.bookUrl); } catch {}
  const bookEnabled = cfg.bookEnabled !== false; // default true
  // Clear TT per root search to avoid mixing scores across different 'me' perspectives
  try { TT.clear(); } catch {}

  const start = performance.now();

  // Opening book lookup (instant reply if available)
  if (bookEnabled) {
    try {
      const bm = await probeBook(state);
      if (bm) {
        // @ts-ignore
        self.postMessage({ type: 'RESULT', bestMove: bm, score: 0, depthReached: 0, pv: [bm], rootMoves: [{ move: bm, score: 0 }], nodes: 0, elapsedMs: performance.now() - start, nps: 0, ttReads: 0, ttHits: 0 });
        return;
      }
    } catch {}
  }
  let best: { move: any; score: number; pv: any[]; rootMoves: Array<{ move: any; score: number }> } = { move: null, score: -Infinity, pv: [], rootMoves: [] };
  let reached = 0;
  let nodes = 0;
  let ttReads = 0;
  let ttHits = 0;
  const shouldStop = () => {
    if (aborted) return true;
    if (timeMs === undefined) return false;
    const elapsed = performance.now() - start;
    return elapsed >= timeMs;
  };

  let lastScore: number | undefined = undefined;
  const ASP_DELTA = 50; // aspiration window half-width
  for (let d = 1; d <= depthMax; d++) {
    if (aborted) return;
    // First try with aspiration window if we have a previous score
    let alpha = -Infinity;
    let beta = +Infinity;
    if (lastScore !== undefined) {
      alpha = lastScore - ASP_DELTA;
      beta = lastScore + ASP_DELTA;
    }
    let stats: SearchStats = { nodes: 0, ttReads: 0, ttHits: 0 };
    let cur = bestMove(state, d, stats, { shouldStop, alpha, beta, pvHint: best.pv });
    nodes += stats.nodes;
    ttReads += stats.ttReads || 0;
    ttHits += stats.ttHits || 0;
    // If we failed low/high, research with full window (unless time is up)
    if (!aborted && !shouldStop() && (cur.score <= alpha || cur.score >= beta)) {
      stats = { nodes: 0, ttReads: 0, ttHits: 0 };
      cur = bestMove(state, d, stats, { shouldStop, alpha: -Infinity, beta: +Infinity, pvHint: cur.pv.length ? cur.pv : best.pv });
      nodes += stats.nodes;
      ttReads += stats.ttReads || 0;
      ttHits += stats.ttHits || 0;
    }
    if (cur.move !== null) {
      best = cur as any;
      lastScore = cur.score;
      reached = d;
      // Optional: post progress
      // @ts-ignore
      self.postMessage({ type: 'PROGRESS', depth: d, score: cur.score, nodes, ttReads, ttHits });
    }
    if (timeMs !== undefined) {
      const elapsed = performance.now() - start;
      if (elapsed >= timeMs) break;
    }
  }

  if (aborted) return;
  const elapsedMs = performance.now() - start;
  const nps = elapsedMs > 0 ? (nodes * 1000) / elapsedMs : nodes;
  // @ts-ignore
  self.postMessage({ type: 'RESULT', bestMove: best.move, score: best.score, depthReached: reached, pv: best.pv ?? [], rootMoves: best.rootMoves ?? [], nodes, elapsedMs, nps, ttReads, ttHits });
};
