import { orderMoves } from '../search/moveOrdering';
import { generateAllMoves, type AIMove } from '../moves';
import type { GameState } from '../../game/types';
import { defaultOptions, type SearchOptions } from '../search/search';
import { evaluate } from '../evaluate';

export type RootSearchResult = {
  bestMove: AIMove | null;
  score: number;
  pv: AIMove[];
  rootMoves: Array<{ move: AIMove; score: number }>;
  nodes: number;
  elapsedMs: number;
  nps: number;
  depthReached: number;
  ttProbes?: number;
  ttHits?: number;
  cutoffs?: number;
  pvsReSearches?: number;
  lmrReductions?: number;
};

export type PoolProgress = {
  completed: number;
  total: number;
  nodes: number;
  alpha: number;
  ttProbes?: number;
  ttHits?: number;
  cutoffs?: number;
  pvsReSearches?: number;
  lmrReductions?: number;
};

type SubtreeJob = {
  jobId: number;
  move: AIMove;
  depth: number;
  alpha: number;
  beta: number;
  fullWindow: boolean;
};

class PoolWorker {
  worker: Worker;
  busy = false;
  currentJob: SubtreeJob | null = null;
  constructor() {
    this.worker = new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' });
  }
  post(msg: any) { this.worker.postMessage(msg); }
  terminate() { try { this.worker.terminate(); } catch {} }
}

export class WorkerPool {
  private workers: PoolWorker[] = [];
  private nextJobId = 1;
  private pending: SubtreeJob[] = [];
  private resolve: ((r: RootSearchResult) => void) | null = null;
  private reject: ((e: any) => void) | null = null;
  private onProgress: ((p: PoolProgress) => void) | null = null;
  private state!: GameState;
  private depth!: number;
  private opts!: Required<SearchOptions>;
  private alpha = -Infinity;
  private beta = +Infinity;
  private totalMoves = 0;
  private completed = 0;
  private nodes = 0;
  private ttProbes = 0;
  private ttHits = 0;
  private cutoffs = 0;
  private pvsReSearches = 0;
  private lmrReductions = 0;
  private best: { move: AIMove | null; score: number; pv: AIMove[] } = { move: null, score: -Infinity, pv: [] };
  private rootMoves: Array<{ move: AIMove; score: number }> = [];
  private startedAt = 0;
  private timeBudgetMs: number | undefined = undefined;

  constructor(size: number) {
    const n = Math.max(1, Math.floor(size));
    for (let i = 0; i < n; i++) {
      const pw = new PoolWorker();
      pw.worker.onmessage = (e: MessageEvent) => this.handleMessage(pw, e.data);
      this.workers.push(pw);
    }
  }

  dispose() {
    for (const w of this.workers) w.terminate();
    this.workers = [];
  }

  cancel() {
    for (const w of this.workers) {
      try { w.post({ type: 'CANCEL' }); } catch {}
    }
    this.pending = [];
  }

  async searchRoot(
    state: GameState,
    depth: number,
    options?: SearchOptions,
    timeMs?: number,
    onProgress?: (p: PoolProgress) => void,
  ): Promise<RootSearchResult> {
    this.state = state;
    this.depth = Math.max(1, Math.floor(depth));
    this.opts = { ...defaultOptions, ...(options || {}) } as Required<SearchOptions>;
    this.onProgress = onProgress || null;
    this.alpha = -Infinity;
    this.beta = +Infinity;
    this.completed = 0;
    this.nodes = 0;
    this.ttProbes = 0;
    this.ttHits = 0;
    this.cutoffs = 0;
    this.pvsReSearches = 0;
    this.lmrReductions = 0;
    this.best = { move: null, score: -Infinity, pv: [] };
    this.rootMoves = [];
    this.timeBudgetMs = typeof timeMs === 'number' ? Math.max(50, Math.floor(timeMs)) : undefined;

    // Generate and order root moves
    const moves = orderMoves(state, generateAllMoves(state), null, this.opts.preferHashMove);
    this.totalMoves = moves.length;
    if (moves.length === 0) {
      const score = evaluate(state, state.currentPlayer);
      return {
        bestMove: null,
        score,
        pv: [],
        rootMoves: [],
        nodes: 0,
        elapsedMs: 0,
        nps: 0,
        depthReached: 0,
      };
    }

    // Queue jobs: first full-window for the first move, then null-window for the rest
    this.pending = [];
    const first = moves[0];
    this.pending.push({ jobId: this.nextJobId++, move: first, depth: this.depth, alpha: this.alpha, beta: this.beta, fullWindow: true });
    for (let i = 1; i < moves.length; i++) {
      this.pending.push({ jobId: this.nextJobId++, move: moves[i], depth: this.depth, alpha: this.alpha, beta: this.alpha + 1, fullWindow: false });
    }

    this.startedAt = performance.now();

    return await new Promise<RootSearchResult>((resolve, reject) => {
      this.resolve = resolve; this.reject = reject;
      // kick off as many jobs as workers
      this.pump();
    });
  }

  private pump() {
    // Assign pending jobs to idle workers
    for (const w of this.workers) {
      if (w.busy) continue;
      const job = this.pending.shift();
      if (!job) continue;
      // If time budget is nearly exhausted, skip re-searches (fullWindow for retries)
      if (this.timeBudgetMs !== undefined) {
        const elapsed = performance.now() - this.startedAt;
        if (elapsed >= this.timeBudgetMs) {
          // Clear remaining re-searches to finish quickly
          this.pending = this.pending.filter(j => j.fullWindow);
        }
      }
      w.busy = true;
      w.currentJob = job;
      try {
        w.post({ type: 'SEARCH_SUBTREE', state: this.state, move: job.move, depth: job.depth, alpha: job.alpha, beta: job.beta, options: this.opts, jobId: job.jobId });
      } catch (err) {
        w.busy = false; w.currentJob = null;
        this.reject?.(err);
        return;
      }
    }
  }

  private finishIfDone() {
    if (this.completed >= this.totalMoves && this.pending.length === 0 && this.workers.every(w => !w.busy)) {
      const elapsedMs = performance.now() - this.startedAt;
      const nps = elapsedMs > 0 ? (this.nodes * 1000) / elapsedMs : this.nodes;
      this.resolve?.({
        bestMove: this.best.move,
        score: this.best.score,
        pv: this.best.pv,
        rootMoves: this.rootMoves,
        nodes: this.nodes,
        elapsedMs,
        nps,
        depthReached: this.depth,
        ttProbes: this.ttProbes,
        ttHits: this.ttHits,
        cutoffs: this.cutoffs,
        pvsReSearches: this.pvsReSearches,
        lmrReductions: this.lmrReductions,
      });
      this.resolve = null; this.reject = null; this.onProgress = null;
    }
  }

  private handleMessage(w: PoolWorker, data: any) {
    if (data && data.type === 'SUBTREE_RESULT') {
      w.busy = false; const job = w.currentJob; w.currentJob = null;
      if (!job) { this.pump(); return; }
      if (typeof data.nodes === 'number') this.nodes += data.nodes;
      this.ttProbes += data.ttProbes || 0;
      this.ttHits += data.ttHits || 0;
      this.cutoffs += data.cutoffs || 0;
      this.pvsReSearches += data.pvsReSearches || 0;
      this.lmrReductions += data.lmrReductions || 0;
      const move: AIMove = job.move;
      const score: number = data.score;
      const pv: AIMove[] = Array.isArray(data.pv) ? data.pv : [move];

      // If this was a null-window search and it "enters" the window, schedule a full re-search
      if (!job.fullWindow && score > this.alpha && score < this.beta) {
        // Respect time budget if any
        if (this.timeBudgetMs === undefined || (performance.now() - this.startedAt) < this.timeBudgetMs) {
          this.pending.unshift({ jobId: this.nextJobId++, move, depth: job.depth, alpha: this.alpha, beta: this.beta, fullWindow: true });
          this.pump();
          return;
        }
      }

      // Finalize this root move result
      this.rootMoves.push({ move, score });
      if (score > this.best.score) {
        this.best = { move, score, pv };
      }
      // Update alpha using fail-soft policy
      if (score > this.alpha) this.alpha = score;

      this.completed += 1;
      if (this.onProgress) this.onProgress({ completed: this.completed, total: this.totalMoves, nodes: this.nodes, alpha: this.alpha, ttProbes: this.ttProbes, ttHits: this.ttHits, cutoffs: this.cutoffs, pvsReSearches: this.pvsReSearches, lmrReductions: this.lmrReductions });

      // After handling result, try to assign more jobs (alpha may have increased)
      // For remaining null-window jobs, we can tighten their beta to new alpha+1
      this.pending = this.pending.map(j => j.fullWindow ? j : { ...j, alpha: this.alpha, beta: this.alpha + 1 });
      this.pump();
      this.finishIfDone();
      return;
    }
  }
}

export function createWorkerPool(maxPool?: number): WorkerPool | null {
  try {
    // Prefer using up to hardwareConcurrency-1 to keep UI thread responsive
    const hc = (typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency) ? (navigator as any).hardwareConcurrency : 2;
    const desired = Math.max(1, Math.min((hc - 1) | 0, maxPool ?? 4));
    return new WorkerPool(desired);
  } catch {
    // WorkerPool unavailable, fall back to single worker silently
    return null;
  }
}
