import type { GameState } from '../game/types';
import { bestMoveIterative, findBestMoveRootParallel } from './search/index';
import { dfpnProbe } from './search/dfpn/dfpn';
import { probe as tableProbe } from './tablebase';
import type { SearchStats, EngineOptions } from './search/types';

export type BestMove = { moveId: string | null; score: number; depthReached: number; engineStats?: Partial<SearchStats> };

export type SearchEvent =
  | { type: 'start'; startedAt: number }
  | { type: 'progress'; nodesVisited: number }
  | { type: 'iter'; depth: number; score: number; bestMove: string | null; pv?: string[] }
  | { type: 'end'; durationMs: number; depthReached: number; score: number; nodesVisited: number };

export interface SearchOptions {
  maxDepth: number; // 1..N
  timeLimitMs: number; // wall clock budget
  onProgress?: (ev: SearchEvent) => void; // optional hooks for instrumentation
  // Optional: restrict root node to a subset of move IDs (for parallelization)
  rootMoves?: string[];
  // Optional: engine options (toggles/params)
  engine?: EngineOptions;
  // Optional: deterministic node budget cutoff
  maxNodes?: number;
}

export async function findBestMove(rootState: GameState, opts: SearchOptions): Promise<BestMove> {
  const stats = { nodes: 0 };
  const allowed = opts.rootMoves ? new Set(opts.rootMoves) : undefined;
  const engineDefaults: EngineOptions = {
    enableTT: true,
    enableKillers: true,
    enableHistory: true,
    enablePVS: true,
    enableLMR: true,
    lmrMinDepth: 3,
    lmrLateMoveIdx: 3,
    lmrReduction: 1,
    enableLMP: true,
    lmpMaxDepth: 2,
    lmpBase: 6,
    preferHashMove: true,
    orderingJitterEps: 0,
    enableAspiration: true,
    aspDelta: 25,
    enableQuiescence: true,
    quiescenceMaxPlies: 4,
    quiescenceStandPatMargin: 0,
    quiescenceSeeMargin: 0,
    quiescenceExtendOnRetire: true,
    quiescenceExtendOnJump: true,
    enableIID: true,
    iidMinDepth: 3,
    enableFutility: true,
    futilityMargin: 150,
    enableAdaptiveTime: true,
    timeSlackMs: 50,
    adaptiveGrowthFactor: 1.8,
    adaptiveBFWeight: 0.05,
    // DFPN defaults (trigger conservador)
    enableDFPN: false,
    dfpnMaxActive: 2,
    // Repetition handling
    drawScore: 0,
    preferDrawWhenLosing: true,
  };

  // Phase detection (opening/middle/end) by retired pieces total
  const retiredTotal = rootState.pieces.filter((p) => p.state === 'retirada').length;
  const phase: 'opening' | 'middle' | 'end' = retiredTotal <= 2 ? 'opening' : (retiredTotal <= 6 ? 'middle' : 'end');
  const phaseEngine = (() => {
    const e = { ...engineDefaults, ...(opts.engine || {}) } as EngineOptions;
    if (e.enableAdaptiveTime) {
      if (phase === 'opening') {
        e.adaptiveGrowthFactor = (opts.engine?.adaptiveGrowthFactor ?? 1.9);
        e.adaptiveBFWeight = (opts.engine?.adaptiveBFWeight ?? 0.06);
        e.timeSlackMs = Math.max(30, e.timeSlackMs ?? 50);
      } else if (phase === 'middle') {
        e.adaptiveGrowthFactor = (opts.engine?.adaptiveGrowthFactor ?? 1.8);
        e.adaptiveBFWeight = (opts.engine?.adaptiveBFWeight ?? 0.05);
        e.timeSlackMs = Math.max(40, e.timeSlackMs ?? 50);
      } else {
        e.adaptiveGrowthFactor = (opts.engine?.adaptiveGrowthFactor ?? 1.6);
        e.adaptiveBFWeight = (opts.engine?.adaptiveBFWeight ?? 0.04);
        e.timeSlackMs = Math.max(60, e.timeSlackMs ?? 50);
      }
    }
    return e;
  })();

  // Tablebase fast-path (if enabled)
  if (phaseEngine.enableTablebase) {
    const hit = tableProbe(rootState);
    if (hit) {
      const started = performance.now();
      opts.onProgress?.({ type: 'start', startedAt: started });
      const score = typeof hit.score === 'number'
        ? hit.score
        : (hit.value === 'win' ? 100000 : hit.value === 'loss' ? -100000 : 0);
      const durationMs = 0;
      const depthReached = 0;
      const nodesVisited = 0;
      opts.onProgress?.({ type: 'end', durationMs, depthReached, score, nodesVisited });
      // Microtask yield to maintain async semantics
      await new Promise((r) => setTimeout(r, 0));
      return { moveId: hit.bestMove ?? null, score, depthReached, engineStats: { nodes: 0, tbHits: 1 } } as any;
    }
  }

  // Optional DFPN probe for tiny endgames
  const activeCount = rootState.pieces.filter((p) => p.state !== 'retirada').length;
  const useDFPN = !!(opts.engine?.enableDFPN ?? engineDefaults.enableDFPN);
  const dfpnActiveMax = Math.max(0, opts.engine?.dfpnMaxActive ?? engineDefaults.dfpnMaxActive ?? 2);
  if (useDFPN && activeCount <= dfpnActiveMax) {
    opts.onProgress?.({ type: 'start', startedAt: performance.now() });
    const probe = dfpnProbe(rootState, { ...engineDefaults, ...(opts.engine || {}) });
    if (probe.solved) {
      const durationMs = 0;
      const depthReached = 1;
      const nodesVisited = 0;
      opts.onProgress?.({ type: 'end', durationMs, depthReached, score: probe.score, nodesVisited });
      // Yield back to UI microtask queue to keep async semantics
      await new Promise((r) => setTimeout(r, 0));
      return { moveId: probe.pv[0] ?? null, score: probe.score, depthReached, engineStats: { nodes: 0, dfpnSolved: true } } as any;
    }
    // If not solved, fall through to iterative deepening as usual
  }

  const res = bestMoveIterative(rootState, {
    maxDepth: opts.maxDepth,
    timeLimitMs: opts.timeLimitMs,
    allowedRootMoves: allowed,
    maxNodes: opts.maxNodes,
    onProgress: (ev: any) => {
      if (ev.type === 'start') {
        opts.onProgress?.({ type: 'start', startedAt: ev.startedAt });
      } else if (ev.type === 'progress') {
        opts.onProgress?.({ type: 'progress', nodesVisited: ev.nodesVisited });
      } else if (ev.type === 'iter') {
        opts.onProgress?.({ type: 'iter', depth: ev.depth, score: ev.score, bestMove: ev.bestMove ?? null, pv: ev.pv });
      } else if (ev.type === 'end') {
        opts.onProgress?.({
          type: 'end',
          durationMs: ev.durationMs,
          depthReached: ev.depthReached,
          score: ev.score,
          nodesVisited: ev.nodesVisited,
        });
      }
    },
    engine: phaseEngine,
  }, stats);
  // Yield back to UI microtask queue to keep compatibility with previous async behavior
  await new Promise((r) => setTimeout(r, 0));
  return { moveId: res.moveId, score: res.score, depthReached: res.depthReached, engineStats: { ...stats } };
}

// Re-export root-parallel orchestrator for UI usage
export { findBestMoveRootParallel };
