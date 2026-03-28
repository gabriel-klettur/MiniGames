import type { EngineOptions } from '../../../../ia/search/types';
import type { GameState } from '../../../../game/types';

export type AIRunnerResult = {
  bestMove: string | null;
  score?: number;
  depthReached?: number;
  nodes?: number;
  elapsedMs?: number;
  nps?: number;
  engineStats?: any;
};

export type AIRunnerProgress = {
  depth?: number;
  score?: number;
  nodes?: number;
};

export function createAIRunner() {
  let worker: Worker | null = null;
  let currentResolve: ((r: AIRunnerResult) => void) | null = null;
  let progressCb: ((p: AIRunnerProgress) => void) | null = null;

  const ensureWorker = () => {
    if (worker) return;
    worker = new Worker(new URL('../../../../ia/aiWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const data = e.data || {};
      if (data.type === 'search_event') {
        progressCb?.({ depth: data.ev?.depth, score: data.ev?.score, nodes: data.ev?.nodesVisited });
      } else if (data.type === 'result') {
        const res: AIRunnerResult = {
          bestMove: (data.moveId ?? null) as string | null,
          score: data.score,
          depthReached: data.depthReached,
          // Map engineStats.nodes (when present) into result.nodes for consumers
          nodes: data.engineStats?.nodes,
          engineStats: data.engineStats,
        };
        currentResolve?.(res);
        currentResolve = null;
      }
    };
  };

  const startSearch = async (args: { state: GameState; depth: number; timeMs?: number; engine?: EngineOptions }, onProgress?: (p: AIRunnerProgress) => void) => {
    ensureWorker();
    progressCb = onProgress || null;
    return await new Promise<AIRunnerResult>((resolve, reject) => {
      currentResolve = resolve;
      try {
        worker!.postMessage({ type: 'run', state: args.state, opts: { maxDepth: args.depth, timeLimitMs: args.timeMs ?? Infinity, engine: args.engine } });
      } catch (err) { reject(err); }
    });
  };

  const cancel = () => {
    try { worker?.terminate(); } catch {}
    worker = null;
    currentResolve = null;
  };

  const dispose = () => {
    try { worker?.terminate(); } catch {}
    worker = null;
  };

  return { startSearch, cancel, dispose };
}
