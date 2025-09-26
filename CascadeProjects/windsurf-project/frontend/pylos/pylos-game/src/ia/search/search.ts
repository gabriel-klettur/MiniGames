import type { GameState, Player } from '../../game/types';
import { generateAllMoves, applyMove } from '../moves';
import type { AIMove } from '../moves';
import { evaluate } from '../evaluate';
import { computeKey } from '../zobrist';
import { TT, TTFlag } from '../tt';
import { getIAFlags } from '../config';
import { makeSignature, type MoveSignature } from '../signature';

type Killers = Array<[MoveSignature | 0, MoveSignature | 0]>; // two per ply
type HistoryMap = Map<MoveSignature, number>;

function isTactical(m: AIMove): boolean {
  return (m.recovers?.length ?? 0) > 0;
}

// ------------------------------
// Quiescence Search (limited)
// ------------------------------
let QDEPTH_MAX = 2;          // limit quiescence depth
let QNODE_CAP_PER_NODE = 24; // cap number of tactical children per q-node
let FUTILITY_MARGIN = 100;   // static margin for futility pruning in qs
let QUIESCENCE_ENABLED = true;

export function setSearchConfig(cfg: Partial<{ qDepthMax: number; qNodeCap: number; futilityMargin: number; quiescence: boolean }>): void {
  if (typeof cfg.qDepthMax === 'number') QDEPTH_MAX = Math.max(0, Math.min(4, Math.floor(cfg.qDepthMax)));
  if (typeof cfg.qNodeCap === 'number') QNODE_CAP_PER_NODE = Math.max(1, Math.min(128, Math.floor(cfg.qNodeCap)));
  if (typeof cfg.futilityMargin === 'number') FUTILITY_MARGIN = Math.max(0, Math.min(1000, Math.floor(cfg.futilityMargin)));
  if (typeof cfg.quiescence === 'boolean') QUIESCENCE_ENABLED = cfg.quiescence;
}

function orderTactical(moves: AIMove[]): AIMove[] {
  // Prefer more recoveries and higher level destinations
  return moves.slice().sort((a, b) => {
    const recA = (a.recovers?.length ?? 0);
    const recB = (b.recovers?.length ?? 0);
    const levA = (a.kind === 'place' ? a.dest.level : a.dest.level);
    const levB = (b.kind === 'place' ? b.dest.level : b.dest.level);
    const sA = recA * 1000 + levA * 10 + (a.kind === 'lift' ? 1 : 0);
    const sB = recB * 1000 + levB * 10 + (b.kind === 'lift' ? 1 : 0);
    return sB - sA;
  });
}

function quiescence(
  state: GameState,
  alpha: number,
  beta: number,
  me: Player,
  stats?: SearchStats,
  opts?: SearchOptions,
  qDepth: number = QDEPTH_MAX,
  ply: number = 0
): SearchResult {
  if (stats) stats.nodes++;
  if (opts?.shouldStop && opts.shouldStop()) return { score: evaluate(state, me), pv: [] };
  const maximizing = (state.currentPlayer === me);

  // Stand-pat evaluation
  const standPat = evaluate(state, me);
  if (maximizing) {
    if (standPat >= beta) return { score: standPat, pv: [] };
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return { score: standPat, pv: [] };
    if (standPat < beta) beta = standPat;
  }

  // Futility pruning: if clearly outside window and no depth left, stop
  if (qDepth <= 0) return { score: standPat, pv: [] };
  if (maximizing && standPat + FUTILITY_MARGIN < alpha) return { score: standPat, pv: [] };
  if (!maximizing && standPat - FUTILITY_MARGIN > beta) return { score: standPat, pv: [] };

  // Generate only tactical moves (= moves with recoveries)
  const all = generateAllMoves(state);
  const tactical = all.filter(m => (m.recovers?.length ?? 0) > 0);
  if (tactical.length === 0) return { score: standPat, pv: [] };

  const ordered = orderTactical(tactical).slice(0, QNODE_CAP_PER_NODE);
  let bestPV: AIMove[] = [];
  let bestScore = standPat;

  for (const m of ordered) {
    const nxt = applyMove(state, m);
    const child = quiescence(nxt, alpha, beta, me, stats, opts, qDepth - 1, ply + 1);
    if (maximizing) {
      if (child.score > bestScore) { bestScore = child.score; bestPV = [m, ...child.pv]; }
      if (child.score > alpha) alpha = child.score;
      if (alpha >= beta) return { score: bestScore, pv: bestPV };
    } else {
      if (child.score < bestScore) { bestScore = child.score; bestPV = [m, ...child.pv]; }
      if (child.score < beta) beta = child.score;
      if (alpha >= beta) return { score: bestScore, pv: bestPV };
    }
    if (opts?.shouldStop && opts.shouldStop()) break;
  }
  return { score: bestScore, pv: bestPV };
}

function orderMoves(
  moves: AIMove[],
  hints: {
    pvSig?: MoveSignature;
    hashSig?: MoveSignature;
    killers?: [MoveSignature | 0, MoveSignature | 0];
    history?: HistoryMap;
  }
): AIMove[] {
  const { pvSig, hashSig, killers, history } = hints;
  return moves.slice().sort((a, b) => {
    // Scores are larger = higher priority
    const score = (m: AIMove): number => {
      let s = 0;
      const sig = makeSignature(m);
      if (pvSig !== undefined && sig === pvSig) s += 1_000_000;
      if (hashSig !== undefined && sig === hashSig) s += 800_000;
      if (killers) {
        if (sig === killers[0]) s += 600_000;
        else if (sig === killers[1]) s += 500_000;
      }
      // History heuristic
      if (history) s += (history.get(sig) ?? 0);
      // Static heuristics
      const rec = (m.recovers?.length ?? 0);
      s += rec * 1000; // prefer moves with recoveries
      const level = m.kind === 'place' ? m.dest.level : m.dest.level;
      s += level * 100; // higher level preferred
      if (m.kind === 'lift') s += 10; // prefer lifting slightly
      return s;
    };
    return score(b) - score(a);
  });
}

export interface SearchStats { nodes: number; ttReads?: number; ttHits?: number }
export interface SearchResult { score: number; pv: AIMove[] }
export interface SearchOptions {
  shouldStop?: () => boolean;
  alpha?: number;
  beta?: number;
  pvHint?: AIMove[]; // principal variation from previous iteration
  // Optional: when provided, only consider these move signatures at the root.
  // This enables root-split parallelization where each worker explores a subset
  // of root moves. Ignored below the root.
  onlyMoveSigs?: MoveSignature[];
  // Optional: penalize root moves that lead to avoided repetition keys.
  // Provide a list of keys (hi,lo) that are already at or above the repetition limit,
  // and a penalty (in evaluation units) to subtract from the child score.
  avoidKeys?: Array<{ hi: number; lo: number }>;
  avoidPenalty?: number;
}

function clampFinite(x: number): number {
  if (!Number.isFinite(x)) return x > 0 ? 1_000_000_000 : -1_000_000_000;
  return x;
}

function searchNode(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  me: Player,
  ply: number,
  killers: Killers,
  history: HistoryMap,
  stats?: SearchStats,
  opts?: SearchOptions,
  pvHintAtNode?: AIMove[]
): SearchResult {
  if (stats) stats.nodes++;
  const maximizing = state.currentPlayer === me;
  if (depth === 0) {
    // Enter quiescence when reaching the leaf to mitigate horizon effects
    if (QUIESCENCE_ENABLED && QDEPTH_MAX > 0) {
      return quiescence(state, alpha, beta, me, stats, opts);
    }
    return { score: evaluate(state, me), pv: [] };
  }

  // TT probe
  const flags = getIAFlags();
  const key = computeKey(state);
  let hashSig: MoveSignature | undefined = undefined;
  if (flags.ttEnabled) {
    if (stats) stats.ttReads = (stats.ttReads ?? 0) + 1;
    const probe = TT.probe(key);
    if (probe) {
      if (stats) stats.ttHits = (stats.ttHits ?? 0) + 1;
      hashSig = probe.bestMove || undefined;
      if (probe.depth >= depth) {
        const val = probe.value;
        if (probe.flag === TTFlag.EXACT) return { score: val, pv: [] };
        if (probe.flag === TTFlag.LOWER) {
          if (val > alpha) alpha = val;
        } else if (probe.flag === TTFlag.UPPER) {
          if (val < beta) beta = val;
        }
        if (alpha >= beta) return { score: val, pv: [] };
      }
    }
  }

  const movesGen = generateAllMoves(state);
  if (movesGen.length === 0) {
    // No legal moves; evaluate position as is
    return { score: evaluate(state, me), pv: [] };
  }

  const pvSig = pvHintAtNode && pvHintAtNode.length > 0 ? makeSignature(pvHintAtNode[0]) : undefined;
  const ordered = orderMoves(movesGen, {
    pvSig,
    hashSig,
    killers: killers[ply],
    history,
  });

  let bestScore = maximizing ? -Infinity : +Infinity;
  let bestPV: AIMove[] = [];
  let bestMoveSig: MoveSignature | 0 = 0;

  // Early stop check
  if (opts?.shouldStop && opts.shouldStop()) {
    const m0 = ordered[0];
    const score0 = evaluate(applyMove(state, m0), me);
    return { score: score0, pv: [m0] };
  }

  const usePVS = flags.pvsEnabled;
  let first = true;
  for (const m of ordered) {
    const nxt = applyMove(state, m);
    let child: SearchResult;
    if (first) {
      child = searchNode(nxt, depth - 1, alpha, beta, me, ply + 1, killers, history, stats, opts, pvHintAtNode?.slice(1));
      first = false;
    } else {
      if (usePVS) {
        // PVS: null-window search
        child = searchNode(nxt, depth - 1, alpha, alpha + 1, me, ply + 1, killers, history, stats, opts, undefined);
        if (maximizing ? child.score > alpha : child.score < beta) {
          child = searchNode(nxt, depth - 1, alpha, beta, me, ply + 1, killers, history, stats, opts, undefined);
        }
      } else {
        child = searchNode(nxt, depth - 1, alpha, beta, me, ply + 1, killers, history, stats, opts, undefined);
      }
    }

    // Update best and window
    if (maximizing) {
      if (child.score > bestScore) {
        bestScore = child.score;
        bestPV = [m, ...child.pv];
        bestMoveSig = makeSignature(m);
      }
      if (bestScore > alpha) alpha = bestScore;
      // Beta cutoff
      if (alpha >= beta) {
        // Killer update for non-tactical moves
        if (!isTactical(m)) {
          const [k0, k1] = killers[ply];
          if (bestMoveSig !== k0 && bestMoveSig !== k1) {
            killers[ply] = [bestMoveSig, k0]; // FIFO
          }
          // History bonus
          history.set(bestMoveSig, (history.get(bestMoveSig) ?? 0) + depth * depth);
        }
        // Store TT as LOWER bound
        if (flags.ttEnabled) TT.store(key, depth, clampFinite(bestScore), TTFlag.LOWER, bestMoveSig);
        return { score: bestScore, pv: bestPV };
      }
    } else {
      if (child.score < bestScore) {
        bestScore = child.score;
        bestPV = [m, ...child.pv];
        bestMoveSig = makeSignature(m);
      }
      if (bestScore < beta) beta = bestScore;
      if (alpha >= beta) {
        if (!isTactical(m)) {
          const [k0, k1] = killers[ply];
          if (bestMoveSig !== k0 && bestMoveSig !== k1) {
            killers[ply] = [bestMoveSig, k0];
          }
          history.set(bestMoveSig, (history.get(bestMoveSig) ?? 0) + depth * depth);
        }
        if (flags.ttEnabled) TT.store(key, depth, clampFinite(bestScore), TTFlag.UPPER, bestMoveSig);
        return { score: bestScore, pv: bestPV };
      }
    }

    if (opts?.shouldStop && opts.shouldStop()) break;
  }

  // Store TT with EXACT/UPPER/LOWER depending on final window
  let flag: TTFlag = TTFlag.EXACT;
  if (bestScore <= alpha) flag = TTFlag.UPPER; // fail-low
  else if (bestScore >= beta) flag = TTFlag.LOWER; // fail-high
  if (flags.ttEnabled) TT.store(key, depth, clampFinite(bestScore), flag, bestMoveSig);
  return { score: bestScore, pv: bestPV };
}

export function bestMove(
  state: GameState,
  depth: number,
  stats?: SearchStats,
  opts?: SearchOptions
): { move: AIMove | null; score: number; pv: AIMove[]; rootMoves: Array<{ move: AIMove; score: number }> } {
  const me: Player = state.currentPlayer;
  // Generate all legal moves at root
  let movesGen = generateAllMoves(state);
  // If a root filter is provided, restrict evaluation to those move signatures
  if (opts?.onlyMoveSigs && opts.onlyMoveSigs.length > 0) {
    const set = new Set<MoveSignature>(opts.onlyMoveSigs);
    movesGen = movesGen.filter(m => set.has(makeSignature(m)));
  }
  if (movesGen.length === 0) return { move: null, score: evaluate(state, me), pv: [], rootMoves: [] };

  // Prepare helpers for ordering at root
  const pvSig = opts?.pvHint && opts.pvHint.length > 0 ? makeSignature(opts.pvHint[0]) : undefined;
  const flagsRoot = getIAFlags();
  const key = computeKey(state);
  let hashSig: MoveSignature | undefined = undefined;
  if (flagsRoot.ttEnabled) {
    const probe = TT.probe(key);
    if (probe) hashSig = probe.bestMove || undefined;
  }

  const killers: Killers = Array.from({ length: 256 }, () => [0, 0]); // support up to 256 plies
  const history: HistoryMap = new Map();
  const alphaInit = opts?.alpha ?? -Infinity;
  const betaInit = opts?.beta ?? +Infinity;
  let alpha = alphaInit;
  let beta = betaInit;

  const ordered = orderMoves(movesGen, { pvSig, hashSig, killers: killers[0], history });

  let bestMoveSel: AIMove | null = null;
  let bestScore = -Infinity;
  let bestPV: AIMove[] = [];
  const rootMoves: Array<{ move: AIMove; score: number }> = [];

  // Build a fast lookup set for avoided keys if provided
  const avoidSet: Set<string> = new Set(
    (opts?.avoidKeys ?? []).map((k) => `${(k.hi >>> 0)}:${(k.lo >>> 0)}`)
  );
  const avoidPenalty = opts?.avoidPenalty ?? 50;

  if (opts?.shouldStop && opts.shouldStop()) {
    const m0 = ordered[0];
    const score0 = evaluate(applyMove(state, m0), me);
    return { move: m0, score: score0, pv: [m0], rootMoves: [{ move: m0, score: score0 }] };
  }

  const usePVSRoot = flagsRoot.pvsEnabled;
  let first = true;
  for (const m of ordered) {
    const nxt = applyMove(state, m);
    let res: SearchResult;
    if (first) {
      res = searchNode(nxt, Math.max(0, depth - 1), alpha, beta, me, 1, killers, history, stats, opts, opts?.pvHint?.slice(1));
      first = false;
    } else {
      if (usePVSRoot) {
        // PVS at root as well
        res = searchNode(nxt, Math.max(0, depth - 1), alpha, alpha + 1, me, 1, killers, history, stats, opts, undefined);
        if (res.score > alpha && res.score < beta) {
          res = searchNode(nxt, Math.max(0, depth - 1), alpha, beta, me, 1, killers, history, stats, opts, undefined);
        }
      } else {
        res = searchNode(nxt, Math.max(0, depth - 1), alpha, beta, me, 1, killers, history, stats, opts, undefined);
      }
    }
    // Apply repetition-avoidance penalty at the root, if enabled
    let childScore = res.score;
    if (avoidSet.size > 0) {
      const k = computeKey(nxt);
      const keyStr = `${(k.hi >>> 0)}:${(k.lo >>> 0)}`;
      if (avoidSet.has(keyStr)) {
        childScore = childScore - avoidPenalty;
      }
    }
    rootMoves.push({ move: m, score: childScore });
    if (childScore > bestScore) {
      bestScore = childScore;
      bestMoveSel = m;
      bestPV = [m, ...res.pv];
    }
    if (bestScore > alpha) alpha = bestScore;
    if (opts?.shouldStop && opts.shouldStop()) break;
  }
  return { move: bestMoveSel, score: bestScore, pv: bestPV, rootMoves };
}
