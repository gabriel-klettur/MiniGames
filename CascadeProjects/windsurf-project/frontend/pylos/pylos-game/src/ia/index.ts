import type { GameState } from '../game/types';
import { bestMove } from './search';
import { applyMove } from './moves';
import type { AIMove } from './moves';

/**
 * Compute the best move for the current player at a given depth.
 * Depth should be in [1..5] per product spec.
 */
export function computeBestMove(state: GameState, depth: number): { move: AIMove | null; score: number } {
  const d = Math.max(1, Math.min(10, Math.floor(depth)));
  return bestMove(state, d);
}

/**
 * Convenience: compute the best move and return the next GameState.
 * If there is no legal move, returns the input state.
 */
export function computeBestNextState(state: GameState, depth: number): GameState {
  const { move } = computeBestMove(state, depth);
  if (!move) return state;
  return applyMove(state, move);
}

// -----------------------------
// Async API via Web Worker
// -----------------------------

let _worker: Worker | null = null;

function ensureWorker(): Worker {
  if (_worker) return _worker;
  _worker = new Worker(new URL('./worker/aiWorker.ts', import.meta.url), { type: 'module' });
  return _worker;
}

export type ComputeOptions = {
  depth?: number; // 1..5
  timeMs?: number; // optional time budget
  signal?: AbortSignal; // optional cancellation
  onProgress?: (info: { depth: number; score: number }) => void;
};

export async function computeBestMoveAsync(state: GameState, opts: ComputeOptions = {}): Promise<{ move: AIMove | null; score: number; depthReached: number }>
{
  const worker = ensureWorker();
  const depth = Math.max(1, Math.min(10, Math.floor(opts.depth ?? 3)));
  const timeMs = typeof opts.timeMs === 'number' ? Math.max(50, Math.floor(opts.timeMs)) : undefined;

  return new Promise((resolve, reject) => {
    let done = false;
    const onMessage = (e: MessageEvent) => {
      const data = e.data || {};
      if (data.type === 'PROGRESS' && opts.onProgress) {
        opts.onProgress({ depth: data.depth, score: data.score });
        return;
      }
      if (data.type === 'RESULT') {
        if (done) return;
        done = true;
        worker.removeEventListener('message', onMessage);
        resolve({ move: data.bestMove ?? null, score: data.score, depthReached: data.depthReached ?? depth });
      }
    };
    worker.addEventListener('message', onMessage);

    const onAbort = () => {
      try { worker.postMessage({ type: 'CANCEL' }); } catch {}
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const cleanup = () => {
      if (opts.signal) opts.signal.removeEventListener('abort', onAbort);
      worker.removeEventListener('message', onMessage);
    };

    if (opts.signal) {
      if (opts.signal.aborted) return onAbort();
      opts.signal.addEventListener('abort', onAbort);
    }

    try {
      worker.postMessage({ type: 'SEARCH', state, depth, timeMs });
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

export async function computeBestNextStateAsync(state: GameState, opts: ComputeOptions = {}): Promise<GameState> {
  const res = await computeBestMoveAsync(state, opts);
  if (!res.move) return state;
  return applyMove(state, res.move);
}
