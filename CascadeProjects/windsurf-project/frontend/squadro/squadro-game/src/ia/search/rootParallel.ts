import type { GameState } from '../../game/types';
import { generateMoves } from '../moves';
import { getWorkers } from '../workerPool';
import type { EngineOptions } from './types';

// Local copy of SearchEvent type to avoid circular imports
type SearchEvent =
  | { type: 'start'; startedAt: number }
  | { type: 'progress'; nodesVisited: number }
  | { type: 'iter'; depth: number; score: number; bestMove: string | null }
  | { type: 'end'; durationMs: number; depthReached: number; score: number; nodesVisited: number };

export interface RootParallelOptions {
  maxDepth: number;
  timeLimitMs: number;
  onProgress?: (ev: SearchEvent) => void;
  rootMoves?: string[];
  engine?: EngineOptions;
}

export type RootParallelResult = { moveId: string | null; score: number; depthReached: number; engineStats?: any };

/**
 * findBestMoveRootParallel — Orquestación en main thread.
 * Lanza N workers (aiWorker.ts) y les reparte los movimientos de raíz.
 * No comparte alpha entre workers (implementación exacta pero sin PVS cross-worker).
 */
export async function findBestMoveRootParallel(state: GameState, opts: RootParallelOptions): Promise<RootParallelResult> {
  const rootMoves = (opts.rootMoves && opts.rootMoves.length > 0)
    ? opts.rootMoves
    : generateMoves(state);

  // Degenerate cases
  if (rootMoves.length <= 1) {
    // Delega al flujo normal usando un solo worker para mantener consistencia de tiempos
    const [w] = getWorkers(1);
    const result = await runOnWorker(w, state, opts);
    return result;
  }

  const desired = Math.max(1, opts.engine?.workers ?? (typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 2) : 2));
  const W = Math.min(desired, rootMoves.length);
  const workers = getWorkers(W);

  // Particionar rootMoves en W buckets
  const buckets: string[][] = Array.from({ length: W }, () => []);
  for (let i = 0; i < rootMoves.length; i++) {
    buckets[i % W].push(rootMoves[i]);
  }

  opts.onProgress?.({ type: 'start', startedAt: performance.now() });

  // Lanzar todos los workers
  const promises = workers.map((w, idx) => runOnWorker(w, state, { ...opts, rootMoves: buckets[idx] }, opts.onProgress));
  const results = await Promise.all(promises);

  // Elegir mejor por score; desempate por depthReached
  let best = results[0];
  for (let i = 1; i < results.length; i++) {
    const r = results[i];
    if (r.score > best.score || (r.score === best.score && (r.depthReached > best.depthReached))) {
      best = r;
    }
  }

  opts.onProgress?.({ type: 'end', durationMs: 0, depthReached: best.depthReached, score: best.score, nodesVisited: 0 });
  return best;
}

function runOnWorker(w: Worker, state: GameState, opts: RootParallelOptions, forward?: (ev: SearchEvent) => void): Promise<RootParallelResult> {
  return new Promise<RootParallelResult>((resolve) => {
    const onMsg = (e: MessageEvent) => {
      const data = e.data as any;
      if (data?.type === 'search_event') {
        forward?.(data.ev as SearchEvent);
      } else if (data?.type === 'result') {
        w.removeEventListener('message', onMsg);
        resolve({ moveId: data.moveId, score: data.score, depthReached: data.depthReached, engineStats: data.engineStats });
      }
    };
    w.addEventListener('message', onMsg);
    w.postMessage({
      type: 'run',
      state,
      opts: {
        maxDepth: opts.maxDepth,
        timeLimitMs: opts.timeLimitMs,
        rootMoves: opts.rootMoves,
        engine: opts.engine,
      },
    });
  });
}
