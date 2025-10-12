import type { GameState, Player } from '../../game/types';
import { generateMoves, applyMove, generateTacticalMoves } from '../moves';
import { evaluate } from '../evaluate';
import { TranspositionTable, type TTEntry } from '../tt';
import type { SearchContext, SearchStats, NodeParams, IterResult, EngineOptions } from './types';
import { orderedMoves } from './moveOrdering';
import { quiesce } from './quiescence';

export interface EngineSearchOptions {
  maxDepth: number;
  timeLimitMs: number;
  onProgress?: (ev: { type: 'start' | 'progress' | 'iter' | 'end'; [k: string]: any }) => void;
  allowedRootMoves?: Set<string>;
  engine?: EngineOptions;
  maxNodes?: number;
}

export function createDefaultContext(): SearchContext {
  return { killers: new Map(), history: new Map() };
}

export function bestMoveIterative(
  rootState: GameState,
  opts: EngineSearchOptions,
  stats: SearchStats,
): { moveId: string | null; score: number; depthReached: number } {
  const start = performance.now();
  const deadline = start + Math.max(10, opts.timeLimitMs);
  const me: Player = rootState.turn;
  const ctx = createDefaultContext();
  const tt = opts.engine?.enableTT ? new TranspositionTable() : null;

  let bestMove: string | null = null;
  let bestScore = -Infinity;
  let depthReached = 0;
  let lastProgressAt = start;
  let prevScore: number | null = null; // for aspiration windows
  let lastIterDurationMs = 0;          // for adaptive time control

  // Throttled reporter used deep in the tree
  const progressHook = () => {
    const now = performance.now();
    // throttle to ~50ms to avoid spamming UI
    if (now - lastProgressAt >= 50) {
      lastProgressAt = now;
      opts.onProgress?.({ type: 'progress', nodesVisited: stats.nodes });
    }
  };

  opts.onProgress?.({ type: 'start', startedAt: start });
  opts.onProgress?.({ type: 'progress', nodesVisited: stats.nodes });

  const reconstructPV = (root: GameState, tt: TranspositionTable | null, maxLen: number): string[] => {
    if (!tt) return [];
    const pv: string[] = [];
    let cur = root;
    for (let i = 0; i < maxLen; i++) {
      const e = tt.get(cur);
      if (!e || !e.bestMove) break;
      pv.push(e.bestMove);
      cur = applyMove(cur, e.bestMove);
    }
    return pv;
  };

  for (let depth = 1; depth <= opts.maxDepth; depth++) {
    const remaining = deadline - performance.now();
    if (remaining <= 1) break;
    // Adaptive time: estimate next iteration cost based on previous iter and root branching factor
    if (opts.engine?.enableAdaptiveTime && depth > 1 && lastIterDurationMs > 0) {
      const baseGrowth = (opts.engine?.adaptiveGrowthFactor ?? 1.8);
      const rootBF = opts.allowedRootMoves?.size ?? generateMoves(rootState).length;
      const bfAdj = Math.max(0, rootBF - 4) * (opts.engine?.adaptiveBFWeight ?? 0.05);
      const growth = baseGrowth + bfAdj;
      const slack = Math.max(0, opts.engine.timeSlackMs ?? 50);
      const predictedNext = lastIterDurationMs * growth;
      if (predictedNext + slack >= remaining) {
        break;
      }
    }
    // Aspiration window: start around previous score when enabled and depth>1
    let alpha0 = -Infinity;
    let beta0 = +Infinity;
    const useAsp = !!opts.engine?.enableAspiration && prevScore !== null && depth > 1;
    if (useAsp) {
      const delta = Math.max(1, opts.engine?.aspDelta ?? 25);
      alpha0 = prevScore! - delta;
      beta0 = prevScore! + delta;
    }
    // Raise alpha0 by sharedRootAlpha from sibling workers if available
    if (typeof opts.engine?.sharedRootAlpha === 'number' && Number.isFinite(opts.engine.sharedRootAlpha)) {
      alpha0 = Math.max(alpha0, opts.engine.sharedRootAlpha);
    }

    // Carry-over PV move from previous iteration to seed root ordering; fall back to cross-worker hint
    const pvHint: string | undefined = (bestMove ?? opts.engine?.rootPVHint ?? undefined);

    const searchOnce = (a: number, b: number): IterResult => negamax({
      state: rootState,
      depth,
      alpha: a,
      beta: b,
      me,
      ply: 0,
      stats,
      maxNodes: opts.maxNodes,
      allowedRootMoves: opts.allowedRootMoves,
      pvHintMove: pvHint || undefined,
      isRoot: true,
      progressHook,
    }, ctx, tt, deadline, opts.engine);

    const iterStart = performance.now();
    let r: IterResult = searchOnce(alpha0, beta0);
    if (r.timeout) break;

    // If aspiration fails low/high, re-search with full window
    if (useAsp && (r.score <= alpha0 || r.score >= beta0)) {
      const r2: IterResult = searchOnce(-Infinity, +Infinity);
      if (r2.timeout) break;
      r = r2;
      if (stats) stats.aspReSearches = (stats.aspReSearches || 0) + 1;
    }
    if (r.timeout) break;
    bestMove = r.bestMove;
    bestScore = r.score;
    depthReached = depth;
    prevScore = r.score;
    lastIterDurationMs = performance.now() - iterStart;
    const pvLine = reconstructPV(rootState, tt, depth);
    opts.onProgress?.({ type: 'iter', depth, score: r.score, bestMove, pv: pvLine });
    if (Math.abs(r.score) > 90000) break; // forced outcome
    const now = performance.now();
    if (now - lastProgressAt >= 0) {
      lastProgressAt = now;
      opts.onProgress?.({ type: 'progress', nodesVisited: stats.nodes });
    }
  }

  const durationMs = performance.now() - start;
  opts.onProgress?.({ type: 'end', durationMs, depthReached, score: bestScore, nodesVisited: stats.nodes });
  return { moveId: bestMove, score: bestScore, depthReached };
}

function storeTT(
  tt: TranspositionTable | null,
  params: NodeParams,
  score: number,
  depth: number,
  bound: TTEntry['bound'],
  bestMove?: string,
): void {
  if (!tt) return;
  tt.set(params.state, { depth, score, bound, bestMove });
}

function probeTT(tt: TranspositionTable | null, params: NodeParams): TTEntry | undefined {
  if (!tt) return undefined;
  params.stats && (params.stats.ttProbes = (params.stats.ttProbes || 0) + 1);
  const e = tt.get(params.state);
  if (e) params.stats && (params.stats.ttHits = (params.stats.ttHits || 0) + 1);
  return e;
}

function getKillers(ctx: SearchContext, ply: number): string[] {
  return ctx.killers.get(ply) || [];
}

function pushKiller(ctx: SearchContext, ply: number, moveId: string): void {
  const arr = ctx.killers.get(ply) || [];
  if (!arr.includes(moveId)) arr.unshift(moveId);
  if (arr.length > 2) arr.length = 2;
  ctx.killers.set(ply, arr);
}

function bumpHistory(ctx: SearchContext, me: Player, moveId: string, bonus: number): void {
  const key = `${me}:${moveId}`;
  ctx.history.set(key, (ctx.history.get(key) || 0) + bonus);
}

function negamax(
  params: NodeParams,
  ctx: SearchContext,
  tt: TranspositionTable | null,
  deadline: number,
  engine?: EngineOptions,
): IterResult {
  const { state, depth, me, ply } = params;

  if (params.stats && typeof params.maxNodes === 'number' && params.stats.nodes >= params.maxNodes) {
    return { score: 0, bestMove: null, timeout: true };
  }

  // Time check
  if (performance.now() >= deadline) return { score: 0, bestMove: null, timeout: true };

  // Terminal: prefer faster wins and delay losses (mate distance)
  if (state.winner) {
    params.stats && (params.stats.nodes += 1);
    if (params.progressHook && params.stats) params.progressHook(params.stats.nodes);
    const WIN = 100000;
    const score = state.winner === me ? (WIN - ply) : (-WIN + ply);
    return { score, bestMove: null, timeout: false };
  }

  // Leaf (non-terminal)
  if (depth === 0) {
    if (engine?.enableQuiescence) {
      return quiesce({
        state,
        alpha: params.alpha,
        beta: params.beta,
        me,
        ply,
        stats: params.stats,
        maxNodes: params.maxNodes,
        qDepth: 0,
      }, ctx, tt, deadline, engine);
    } else {
      params.stats && (params.stats.nodes += 1);
      if (params.progressHook && params.stats) params.progressHook(params.stats.nodes);
      return { score: evaluate(state, me), bestMove: null, timeout: false };
    }
  }

  // TT probe
  const ttEntry = probeTT(tt, params);
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.bound === 'EXACT') return { score: ttEntry.score, bestMove: ttEntry.bestMove ?? null, timeout: false };
    if (ttEntry.bound === 'LOWER' && ttEntry.score > params.alpha) params.alpha = ttEntry.score;
  }

  // Internal Iterative Deepening (IID): if no hash move and depth is sufficient, probe depth-1
  let iidBest: string | null = null;
  if (!!engine?.enableIID && depth >= (engine?.iidMinDepth ?? 3) && !params.iidProbe) {
    const hasHashMove = !!(ttEntry && ttEntry.bestMove);
    if (!hasHashMove) {
      const probe: IterResult = negamax({
        state,
        depth: depth - 1,
        alpha: params.alpha,
        beta: params.alpha + 1, // narrow window
        me,
        ply: ply,
        stats: params.stats,
        iidProbe: true,
        progressHook: params.progressHook,
      }, ctx, tt, deadline, engine);
      if (probe.timeout) return probe;
      if (params.stats) params.stats.iidProbes = (params.stats.iidProbes || 0) + 1;
      iidBest = probe.bestMove;
    }
  }
  // If we had a TT entry with an UPPER bound, adjust beta
  if (ttEntry && ttEntry.bound === 'UPPER' && ttEntry.score < params.beta) params.beta = ttEntry.score;
  if (ttEntry && params.alpha >= params.beta) {
    params.stats && (params.stats.cutoffs = (params.stats.cutoffs || 0) + 1);
    return { score: ttEntry.score, bestMove: ttEntry.bestMove ?? null, timeout: false };
  }

  // Generate and order moves
  let moves = generateMoves(state);
  if (params.isRoot && params.allowedRootMoves) moves = moves.filter((m) => params.allowedRootMoves!.has(m));
  if (moves.length === 0) {
    params.stats && (params.stats.nodes += 1);
    if (params.progressHook && params.stats) params.progressHook(params.stats.nodes);
    return { score: evaluate(state, me), bestMove: null, timeout: false };
  }

  // Futility pruning (node-level): shallow depth, non-PV, non-tactical environment
  if (!!engine?.enableFutility && !params.isRoot && depth <= 2) {
    const staticEval = evaluate(state, me);
    const margin = (engine?.futilityMargin ?? 150) * Math.max(1, depth);
    const tactsHere = generateTacticalMoves(state);
    if (staticEval + margin <= params.alpha && tactsHere.length === 0) {
      // Safe to assume no move will raise alpha sufficiently; prune with alpha bound
      params.stats && (params.stats.futilityPrunes = (params.stats.futilityPrunes || 0) + 1);
      return { score: params.alpha, bestMove: null, timeout: false };
    }
  }

  const killers = getKillers(ctx, ply);
  // Precompute tactical moves at this node for LMP decisions
  const tactSet: Set<string> | null = (engine?.enableLMP || engine?.enableFutility) ? new Set(generateTacticalMoves(state)) : null;
  // Prefer PV hint at root; otherwise use TT hash move if enabled
  let hashMove: string | null = null;
  if (params.isRoot && params.pvHintMove && moves.includes(params.pvHintMove)) {
    hashMove = params.pvHintMove;
  } else if (engine?.preferHashMove && ttEntry?.bestMove && moves.includes(ttEntry.bestMove)) {
    hashMove = ttEntry.bestMove;
  } else if (iidBest && moves.includes(iidBest)) {
    hashMove = iidBest;
  }
  if (hashMove) {
    params.stats && (params.stats.hashMoveUsed = (params.stats.hashMoveUsed || 0) + 1);
  }
  const ordered = orderedMoves(state, moves, me, { hashMove, killers, history: ctx.history, jitter: engine?.orderingJitterEps });

  let bestScore = -Infinity;
  let bestMove: string | null = null;
  let a = params.alpha;
  const b = params.beta;

  for (let i = 0; i < ordered.length; i++) {
    const mv = ordered[i];
    const child = applyMove(state, mv);
    const isPV = i === 0; // principal variation candidate
    if (killers.includes(mv)) {
      params.stats && (params.stats.killersTried = (params.stats.killersTried || 0) + 1);
    }

    let score: number;

    // Late Move Pruning (LMP): at shallow depths, skip very late non-tactical moves (non-PV)
    if (!!engine?.enableLMP && !isPV && depth <= (engine?.lmpMaxDepth ?? 2)) {
      const threshold = (engine?.lmpBase ?? 6) + 2 * depth;
      const isTactical = tactSet ? tactSet.has(mv) : false;
      if (i >= threshold && !isTactical) {
        // Skip searching this move
        params.stats && (params.stats.lmpPrunes = (params.stats.lmpPrunes || 0) + 1);
        continue;
      }
    }

    // Late Move Reductions (LMR): on non-PV, non-tactical late moves, try reduced-depth zero-window
    const isTacticalMove = tactSet ? tactSet.has(mv) : false;
    const canLMR = !!engine?.enableLMR
      && !isPV
      && !isTacticalMove
      && depth >= (engine?.lmrMinDepth ?? 3)
      && i >= (engine?.lmrLateMoveIdx ?? 3);

    if (canLMR) {
      // Dynamic reduction: base + index bonus - history credit
      const base = Math.max(1, engine?.lmrReduction ?? 1);
      const idxBonus = i >= 6 ? 1 : 0;
      const histKey = `${me}:${mv}`;
      const histVal = ctx.history.get(histKey) || 0;
      const histBonus = histVal > 500 ? 1 : 0; // strong history lowers reduction
      const red = Math.max(1, base + idxBonus - histBonus);
      const reducedDepth = Math.max(1, depth - 1 - red);
      const r1: IterResult = negamax({
        state: child,
        depth: reducedDepth,
        alpha: -a - 1,
        beta: -a,
        me,
        ply: ply + 1,
        stats: params.stats,
        maxNodes: params.maxNodes,
        progressHook: params.progressHook,
      }, ctx, tt, deadline, engine);
      if (r1.timeout) return r1;
      score = -r1.score;
      if (params.stats) params.stats.lmrReductions = (params.stats.lmrReductions || 0) + 1;
      // If it fails-high over alpha, re-search at full depth using PVS/full window
      if (score > a) {
        // fall-through to re-search logic below as if null-window succeeded
      } else {
        // accept reduced result
        if (score > bestScore) {
          bestScore = score;
          bestMove = mv;
        }
        if (bestScore > a) a = bestScore;
        if (a >= b) {
          params.stats && (params.stats.cutoffs = (params.stats.cutoffs || 0) + 1);
          pushKiller(ctx, ply, mv);
          bumpHistory(ctx, me, mv, depth * depth);
          if (params.stats) params.stats.historyUpdates = (params.stats.historyUpdates || 0) + 1;
          break;
        }
        continue;
      }
    }

    if (!!engine?.enablePVS && !isPV) {
      // PVS: try a null-window search first
      const r0 = negamax({
        state: child,
        depth: depth - 1,
        alpha: -a - 1,
        beta: -a,
        me,
        ply: ply + 1,
        stats: params.stats,
        maxNodes: params.maxNodes,
        progressHook: params.progressHook,
      }, ctx, tt, deadline, engine);
      if (r0.timeout) return r0;
      score = -r0.score;
      if (score > a && score < b) {
        // Re-search at full window
        const r2 = negamax({
          state: child,
          depth: depth - 1,
          alpha: -b,
          beta: -a,
          me,
          ply: ply + 1,
          stats: params.stats,
          maxNodes: params.maxNodes,
          progressHook: params.progressHook,
        }, ctx, tt, deadline, engine);
        if (r2.timeout) return r2;
        score = -r2.score;
        if (params.stats) params.stats.pvsReSearches = (params.stats.pvsReSearches || 0) + 1;
      }
    } else {
      // Regular full-window search (first move or PVS disabled)
      const r = negamax({
        state: child,
        depth: depth - 1,
        alpha: -b,
        beta: -a,
        me,
        ply: ply + 1,
        stats: params.stats,
        maxNodes: params.maxNodes,
        progressHook: params.progressHook,
      }, ctx, tt, deadline, engine);
      if (r.timeout) return r;
      score = -r.score;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = mv;
    }
    if (bestScore > a) a = bestScore;
    if (a >= b) {
      // beta cutoff
      params.stats && (params.stats.cutoffs = (params.stats.cutoffs || 0) + 1);
      pushKiller(ctx, ply, mv);
      bumpHistory(ctx, me, mv, depth * depth);
      if (params.stats) params.stats.historyUpdates = (params.stats.historyUpdates || 0) + 1;
      break;
    }
  }

  // Store TT bound
  if (tt) {
    const bound: TTEntry['bound'] = bestScore <= params.alpha ? 'UPPER' : (bestScore >= params.beta ? 'LOWER' : 'EXACT');
    storeTT(tt, params, bestScore, depth, bound, bestMove || undefined);
  }

  return { score: bestScore, bestMove, timeout: false };
}
