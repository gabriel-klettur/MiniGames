/* eslint-disable no-restricted-globals */
import type { GameState } from '../../game/types';
import { bestMove } from '../search';

// Messages from main thread
// { type: 'SEARCH', state, depth?: number, timeMs?: number }
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
  const state: GameState = data.state;
  const depthMax: number = Math.max(1, Math.min(10, Math.floor(data.depth ?? 3)));
  const timeMs: number | undefined = typeof data.timeMs === 'number' ? Math.max(50, data.timeMs) : undefined;

  const start = performance.now();
  let best: { move: any; score: number } = { move: null, score: -Infinity };
  let reached = 0;

  for (let d = 1; d <= depthMax; d++) {
    if (aborted) return;
    const cur = bestMove(state, d);
    if (cur.move !== null) {
      best = cur;
      reached = d;
      // Optional: post progress
      // @ts-ignore
      self.postMessage({ type: 'PROGRESS', depth: d, score: cur.score });
    }
    if (timeMs !== undefined) {
      const elapsed = performance.now() - start;
      if (elapsed >= timeMs) break;
    }
  }

  if (aborted) return;
  // @ts-ignore
  self.postMessage({ type: 'RESULT', bestMove: best.move, score: best.score, depthReached: reached });
};
