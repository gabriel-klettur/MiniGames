import type { SearchOptions } from '../../../../ia/search/search';
export type AIRunnerResult = {
  bestMove: any | null;
  score?: number;
  depthReached?: number;
  pv?: any[];
  rootMoves?: Array<{ move: any; score: number }>;
  nodes?: number;
  elapsedMs?: number;
  nps?: number;
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
  let searchId = 0;

  const ensureWorker = () => {
    if (worker) return;
    // From src/components/DevTools/InfoIA/services -> up to src, then to ia/worker
    worker = new Worker(new URL('../../../../ia/worker/aiWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const data = e.data || {};
      if (typeof data.searchId === 'number' && data.searchId !== searchId) return;
      if (data.type === 'PROGRESS') {
        progressCb?.({ depth: data.depth, score: data.score, nodes: data.nodes });
      } else if (data.type === 'RESULT') {
        const res: AIRunnerResult = {
          bestMove: data.bestMove ?? null,
          score: data.score,
          depthReached: data.depthReached,
          pv: data.pv,
          rootMoves: data.rootMoves,
          nodes: data.nodes,
          elapsedMs: data.elapsedMs,
          nps: data.nps,
        };
        currentResolve?.(res);
        currentResolve = null;
      }
    };
  };

  const startSearch = async (args: { state: any; depth: number; timeMs?: number; options?: SearchOptions }, onProgress?: (p: AIRunnerProgress) => void) => {
    ensureWorker();
    progressCb = onProgress || null;
    searchId += 1;
    // Cancel any previous search
    try { worker!.postMessage({ type: 'CANCEL' }); } catch {}
    return await new Promise<AIRunnerResult>((resolve, reject) => {
      currentResolve = resolve;
      try {
        worker!.postMessage({ type: 'SEARCH', state: args.state, depth: args.depth, timeMs: args.timeMs, options: args.options, searchId });
      } catch (err) {
        reject(err);
      }
    });
  };

  const cancel = () => {
    try { worker?.postMessage({ type: 'CANCEL' }); } catch {}
  };

  const dispose = () => {
    try { worker?.terminate(); } catch {}
    worker = null;
  };

  return { startSearch, cancel, dispose };
}
