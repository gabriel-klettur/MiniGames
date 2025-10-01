import type { GameState } from '../game/types';
import { bestMove } from './search/search';
import { TT } from './tt';
import { applyMove, generateAllMoves } from './moves';
import type { AIMove } from './moves';
import { makeSignature, type MoveSignature } from './signature';
import { positions, getCell } from '../game/board';

/**
 * Compute the best move for the current player at a given depth.
 * Depth should be in [1..5] per product spec.
 */
function pickFirstMoveByMode(rootMoves: AIMove[], startCfg: NonNullable<ComputeOptions['cfg']>['start'] | undefined): AIMove | null {
  if (!rootMoves || rootMoves.length === 0) return null;
  const mode = startCfg?.mode;
  // Resolve seed
  const hasSeed = typeof startCfg?.seed === 'number';
  const ri = (n: number) => hasSeed ? seededRandomInt(startCfg!.seed as number, n) : randomInt(n);
  // Back-compat: if no mode but randomFirstMove=true, behave as 'random'
  const effectiveMode: 'book' | 'random' | 'center-topk' = mode ?? ((startCfg?.randomFirstMove ? 'random' : 'book'));
  if (effectiveMode === 'book') return null; // let book/search handle
  if (effectiveMode === 'random') {
    return rootMoves[ri(rootMoves.length)];
  }
  // center-topk: score placements by distance to center, pick among top-K randomly
  const k = Math.max(1, Math.min(16, Math.floor(startCfg?.centerTopK ?? 4)));
  type Scored = { m: AIMove; score: number };
  const center = 1.5; // level 0 grid is 4x4; center at (1.5,1.5)
  const scored: Scored[] = rootMoves.map((m) => {
    const d = m.kind === 'place' ? Math.abs(m.dest.row - center) + Math.abs(m.dest.col - center) : 10_000;
    return { m, score: d };
  });
  scored.sort((a, b) => a.score - b.score);
  const top = scored.slice(0, Math.min(k, scored.length));
  return top.length > 0 ? top[ri(top.length)].m : rootMoves[ri(rootMoves.length)];
}
export function computeBestMove(state: GameState, depth: number): { move: AIMove | null; score: number } {
  const d = Math.max(1, Math.min(10, Math.floor(depth)));
  try { TT.clear(); } catch {}
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

// -----------------------------
// Helpers
// -----------------------------

function isBoardEmpty(state: GameState): boolean {
  for (const p of positions()) {
    if (getCell(state.board, p) !== null) return false;
  }
  return true;
}

function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * Math.max(0, maxExclusive));
}

function seededRandomInt(seed: number, maxExclusive: number): number {
  // Simple LCG for a single-step deterministic index
  let s = (seed >>> 0) || 1;
  s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  return (s % Math.max(1, maxExclusive)) >>> 0;
}

export type ComputeOptions = {
  depth?: number; // 1..5
  timeMs?: number; // optional time budget
  signal?: AbortSignal; // optional cancellation
  onProgress?: (info: { depth: number; score: number; nodes?: number }) => void;
  cfg?: {
    search?: Partial<{ qDepthMax: number; qNodeCap: number; futilityMargin: number; quiescence: boolean }>;
    bookEnabled?: boolean;
    bookUrl?: string;
    flags?: Partial<{ precomputedSupports: boolean; precomputedCenter: boolean; pvsEnabled: boolean; aspirationEnabled: boolean; ttEnabled: boolean; bitboardsEnabled: boolean }>;
    // Start behavior (first move)
    start?: Partial<{
      // Back-compat boolean (if true and no mode provided -> behaves like mode 'random')
      randomFirstMove: boolean;
      // New: explicit mode selector
      mode: 'book' | 'random' | 'center-topk';
      // Seed for reproducibility
      seed: number;
      // For 'center-topk': number of top central placements to sample from
      centerTopK: number;
    }>;
  };
  // Optional: desired number of workers for parallel search. If 'auto', we pick a sensible
  // value from hardwareConcurrency, capped to [1..4]. If omitted, default is 'auto'.
  workers?: number | 'auto';
  // Optional: repetition-avoidance at the root (penalize moves that lead to these keys)
  avoidKeys?: Array<{ hi: number; lo: number }>; // keys at/above repeat threshold
  avoidPenalty?: number; // evaluation units to subtract (default 50)
  // Optional: weighted repetition-avoidance list (preferred if provided)
  avoidList?: Array<{ hi: number; lo: number; weight: number }>;
  // Optional: novelty bonus inputs
  noveltyKeys?: Array<{ hi: number; lo: number }>;
  noveltyBonus?: number;
  // Optional: root diversification to escape repetition cycles.
  diversify?: 'off' | 'epsilon';
  epsilon?: number;
  tieDelta?: number;
  randSeed?: number;
  // Optional: limit epsilon sampling to Top-K root candidates
  rootTopK?: number;
  // Optional: seedable jitter and LMR controls at root, and draw bias for cycles
  rootJitter?: boolean;
  rootJitterProb?: number;
  rootLMR?: boolean;
  drawBias?: number;
};

export async function computeBestMoveAsync(state: GameState, opts: ComputeOptions = {}): Promise<{
  move: AIMove | null;
  score: number;
  depthReached: number;
  pv: AIMove[];
  rootMoves: Array<{ move: AIMove; score: number }>;
  nodes: number;
  elapsedMs: number;
  nps: number;
  ttReads?: number;
  ttHits?: number;
  usedWorkers?: number;
  source?: 'book' | 'start' | 'search';
  avoidAppliedCount?: number;
  avoidAppliedWeight?: number;
}>
{
  // Special-case: configurable first move if board is empty (AI starts the match)
  if (isBoardEmpty(state)) {
    const rootMoves = generateAllMoves(state);
    const mv = pickFirstMoveByMode(rootMoves, opts.cfg?.start);
    if (mv) {
      return {
        move: mv,
        score: 0,
        depthReached: 0,
        pv: [mv],
        rootMoves: [{ move: mv, score: 0 }],
        nodes: 0,
        elapsedMs: 0,
        nps: 0,
        ttReads: 0,
        ttHits: 0,
        usedWorkers: 1,
        source: 'start',
      };
    }
  }
  // If the caller explicitly requests parallelism, route to the parallel implementation.
  if (typeof opts.workers !== 'undefined') {
    try {
      const w = desiredWorkers(opts.workers);
      if (w > 1) return await computeBestMoveParallel(state, opts);
    } catch {}
  }
  const worker = ensureWorker();
  const depth = Math.max(1, Math.min(10, Math.floor(opts.depth ?? 3)));
  const timeMs = typeof opts.timeMs === 'number' ? Math.max(50, Math.floor(opts.timeMs)) : undefined;

  return new Promise((resolve, reject) => {
    let done = false;
    const onMessage = (e: MessageEvent) => {
      const data = e.data || {};
      if (data.type === 'PROGRESS' && opts.onProgress) {
        opts.onProgress({ depth: data.depth, score: data.score, nodes: data.nodes });
        return;
      }
      if (data.type === 'RESULT') {
        if (done) return;
        done = true;
        worker.removeEventListener('message', onMessage);
        resolve({
          move: data.bestMove ?? null,
          score: data.score,
          depthReached: data.depthReached ?? depth,
          pv: (data.pv ?? []) as AIMove[],
          rootMoves: (data.rootMoves ?? []) as Array<{ move: AIMove; score: number }>,
          nodes: data.nodes ?? 0,
          elapsedMs: data.elapsedMs ?? 0,
          nps: data.nps ?? 0,
          ttReads: data.ttReads,
          ttHits: data.ttHits,
          usedWorkers: 1,
          source: data.source as ('book' | 'start' | 'search' | undefined),
          avoidAppliedCount: data.avoidAppliedCount,
          avoidAppliedWeight: data.avoidAppliedWeight,
        });
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
      worker.postMessage({
        type: 'SEARCH',
        state,
        depth,
        timeMs,
        cfg: opts.cfg,
        avoidKeys: opts.avoidKeys,
        avoidPenalty: opts.avoidPenalty,
        avoidList: opts.avoidList,
        noveltyKeys: opts.noveltyKeys,
        noveltyBonus: opts.noveltyBonus,
        rootTopK: typeof opts.rootTopK === 'number' ? Math.floor(opts.rootTopK) : undefined,
        rootJitter: typeof opts.rootJitter === 'boolean' ? opts.rootJitter : undefined,
        rootJitterProb: typeof opts.rootJitterProb === 'number' ? Number(opts.rootJitterProb) : undefined,
        rootLMR: typeof opts.rootLMR === 'boolean' ? opts.rootLMR : undefined,
        drawBias: typeof opts.drawBias === 'number' ? Math.floor(opts.drawBias) : undefined,
        diversify: opts.diversify,
        epsilon: opts.epsilon,
        tieDelta: opts.tieDelta,
        randSeed: typeof opts.randSeed === 'number' ? (opts.randSeed >>> 0) : undefined,
      });
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

// -------------------------------------------------
// Parallel API via Worker Pool (root-split alpha-beta)
// -------------------------------------------------

let _pool: Worker[] = [];

function createWorker(): Worker {
  return new Worker(new URL('./worker/aiWorker.ts', import.meta.url), { type: 'module' });
}

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }

function desiredWorkers(w: number | 'auto' | undefined): number {
  if (w && w !== 'auto') return clamp(Math.floor(w), 1, 4);
  const hc = (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number') ? navigator.hardwareConcurrency : 2;
  // Use hc - 1 to leave room for UI thread, cap to [1..4]
  return clamp(Math.max(1, hc - 1), 1, 4);
}

function ensurePool(size: number): Worker[] {
  const s = clamp(size, 1, 4);
  // Grow
  while (_pool.length < s) _pool.push(createWorker());
  // Shrink (do not terminate workers aggressively; keep a small pool hot)
  if (_pool.length > s) _pool = _pool.slice(0, s);
  return _pool;
}

function partition<T>(arr: T[], k: number): T[][] {
  const out: T[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < arr.length; i++) out[i % k].push(arr[i]);
  return out;
}

export async function computeBestMoveParallel(state: GameState, opts: ComputeOptions = {}): Promise<{
  move: AIMove | null;
  score: number;
  depthReached: number;
  pv: AIMove[];
  rootMoves: Array<{ move: AIMove; score: number }>;
  nodes: number;
  elapsedMs: number;
  nps: number;
  ttReads?: number;
  ttHits?: number;
  usedWorkers: number;
  source?: 'book' | 'start' | 'search';
  avoidAppliedCount?: number;
  avoidAppliedWeight?: number;
}> {
  const depth = Math.max(1, Math.min(10, Math.floor(opts.depth ?? 3)));
  const timeMs = typeof opts.timeMs === 'number' ? Math.max(50, Math.floor(opts.timeMs)) : undefined;

  // Generate and shard root moves by signature
  const rootMoves = generateAllMoves(state);
  if (isBoardEmpty(state)) {
    if (rootMoves.length === 0) {
      const startEval = bestMove(state, 1); // quick evaluate for score
      return {
        move: null,
        score: startEval.score,
        depthReached: 0,
        pv: [],
        rootMoves: [],
        nodes: 0,
        elapsedMs: 0,
        nps: 0,
        usedWorkers: 1,
      };
    }
    const mv = pickFirstMoveByMode(rootMoves, opts.cfg?.start);
    if (mv) {
      return {
        move: mv,
        score: 0,
        depthReached: 0,
        pv: [mv],
        rootMoves: rootMoves.map((m) => ({ move: m, score: 0 })),
        nodes: 0,
        elapsedMs: 0,
        nps: 0,
        usedWorkers: 1,
        source: 'start',
      };
    }
  }
  if (rootMoves.length === 0) {
    const startEval = bestMove(state, 1); // quick evaluate for score
    return {
      move: null,
      score: startEval.score,
      depthReached: 0,
      pv: [],
      rootMoves: [],
      nodes: 0,
      elapsedMs: 0,
      nps: 0,
      usedWorkers: 1,
    };
  }

  const rootSigs: MoveSignature[] = rootMoves.map((m) => makeSignature(m));
  let W = desiredWorkers(opts.workers);
  W = clamp(Math.min(W, rootMoves.length), 1, 4);
  const shards = partition(rootSigs, W).filter(sh => sh.length > 0);
  const workers = ensurePool(shards.length);

  const start = performance.now();
  let doneCount = 0;
  let aborted = false;
  const perNodes = new Array<number>(workers.length).fill(0);
  let maxDepthSeen = 0;

  type PartialResult = {
    move: AIMove | null;
    score: number;
    depthReached: number;
    pv: AIMove[];
    rootMoves: Array<{ move: AIMove; score: number }>;
    nodes: number;
    elapsedMs: number;
    nps: number;
    ttReads?: number;
    ttHits?: number;
    source?: 'book' | 'search';
    avoidAppliedCount?: number;
    avoidAppliedWeight?: number;
  };

  const partials: PartialResult[] = new Array(shards.length);

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      if (opts.signal) opts.signal.removeEventListener('abort', onAbort);
      for (let i = 0; i < workers.length; i++) workers[i].removeEventListener('message', handlers[i]);
    };

    const onAbort = () => {
      aborted = true;
      try { for (const w of workers) w.postMessage({ type: 'CANCEL' }); } catch {}
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    if (opts.signal) {
      if (opts.signal.aborted) return onAbort();
      opts.signal.addEventListener('abort', onAbort);
    }

    const handlers: ((e: MessageEvent) => void)[] = workers.map((_, idx) => (e: MessageEvent) => {
      const data = e.data || {};
      if (data.type === 'PROGRESS') {
        perNodes[idx] = data.nodes ?? perNodes[idx];
        if (typeof data.depth === 'number' && data.depth > maxDepthSeen) maxDepthSeen = data.depth;
        if (opts.onProgress) {
          const totalNodes = perNodes.reduce((a, b) => a + (b || 0), 0);
          opts.onProgress({ depth: maxDepthSeen, score: data.score ?? 0, nodes: totalNodes });
        }
        return;
      }
      if (data.type === 'RESULT') {
        if (aborted) return;
        partials[idx] = {
          move: data.bestMove ?? null,
          score: data.score,
          depthReached: data.depthReached ?? depth,
          pv: (data.pv ?? []) as AIMove[],
          rootMoves: (data.rootMoves ?? []) as Array<{ move: AIMove; score: number }>,
          nodes: data.nodes ?? 0,
          elapsedMs: data.elapsedMs ?? 0,
          nps: data.nps ?? 0,
          ttReads: data.ttReads,
          ttHits: data.ttHits,
          source: data.source as ('book' | 'search' | undefined),
          avoidAppliedCount: data.avoidAppliedCount,
          avoidAppliedWeight: data.avoidAppliedWeight,
        };
        doneCount++;
        if (doneCount >= shards.length) {
          cleanup();
          // Aggregate
          let best: PartialResult | null = null;
          for (const pr of partials) {
            if (!pr) continue;
            if (!best || pr.score > best.score) best = pr;
          }
          const elapsedMs = performance.now() - start;
          const nodes = partials.reduce((acc, pr) => acc + ((pr && pr.nodes) || 0), 0);
          const nps = elapsedMs > 0 ? (nodes * 1000) / elapsedMs : nodes;
          const mergedRoot: Array<{ move: AIMove; score: number }> = [];
          for (const pr of partials) if (pr) mergedRoot.push(...pr.rootMoves);
          const totalAvoidCount = partials.reduce((acc, pr) => acc + ((pr && pr.avoidAppliedCount) || 0), 0);
          const totalAvoidWeight = partials.reduce((acc, pr) => acc + ((pr && pr.avoidAppliedWeight) || 0), 0);
          resolve({
            move: best?.move ?? null,
            score: best?.score ?? 0,
            depthReached: best?.depthReached ?? 0,
            pv: best?.pv ?? [],
            rootMoves: mergedRoot,
            nodes,
            elapsedMs,
            nps,
            ttReads: undefined,
            ttHits: undefined,
            usedWorkers: shards.length,
            source: best?.source,
            avoidAppliedCount: totalAvoidCount,
            avoidAppliedWeight: totalAvoidWeight,
          });
        }
      }
    });

    // Attach handlers and launch
    for (let i = 0; i < workers.length; i++) {
      const w = workers[i];
      w.addEventListener('message', handlers[i]);
      try {
        w.postMessage({
          type: 'SEARCH',
          state,
          depth,
          timeMs,
          cfg: opts.cfg,
          avoidKeys: opts.avoidKeys,
          avoidPenalty: opts.avoidPenalty,
          avoidList: opts.avoidList,
          noveltyKeys: opts.noveltyKeys,
          noveltyBonus: opts.noveltyBonus,
          onlyMoveSigs: shards[i].map((s) => s >>> 0),
          diversify: opts.diversify,
          epsilon: opts.epsilon,
          tieDelta: opts.tieDelta,
          randSeed: typeof opts.randSeed === 'number' ? (opts.randSeed >>> 0) : undefined,
        });
      } catch (err) {
        // If any launch fails, abort all and reject
        try { for (const ww of workers) ww.postMessage({ type: 'CANCEL' }); } catch {}
        cleanup();
        reject(err);
        return;
      }
    }
  });
}
