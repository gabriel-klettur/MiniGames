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
  // (novelty bonus applies at root only)

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
  // Optional: penalize with per-key weights (preferred over avoidKeys/avoidPenalty if provided)
  // Each entry provides the zobrist key and a weight to subtract from the child score.
  avoidList?: Array<{ hi: number; lo: number; weight: number }>;
  // Optional: novelty bonus: add a small bonus to root child scores that lead to states not seen in the current game.
  // Provide the list of seen keys (noveltyKeys), and a noveltyBonus value to add when the child state key is NOT in the set.
  noveltyKeys?: Array<{ hi: number; lo: number }>;
  noveltyBonus?: number;
  // Optional: root diversification to escape repetition cycles.
  // If set to 'epsilon', with probability epsilon choose among near-best candidates
  // within tieDelta of the top score (in evaluation units). Selection uses a simple RNG
  // which may be seeded via randSeed for reproducibility.
  diversify?: 'off' | 'epsilon';
  epsilon?: number; // 0..1
  tieDelta?: number; // e.g., 10..30 eval units
  randSeed?: number; // optional seed for reproducible sampling
  // Optional: limit epsilon sampling to the Top-K root candidates by score (default 3)
  rootTopK?: number;
  // Optional: add a tiny random jitter (seedable) to root ordering when repetition risk exists
  rootJitter?: boolean;
  rootJitterProb?: number; // probability of swapping neighboring moves (default 0.1)
  // Optional: enable/disable LMR-like depth adjustment at root under repetition risk (default true)
  rootLMR?: boolean;
  // Optional: draw bias for cycle detection in PV (default 5 eval units)
  drawBias?: number;
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
  repPath?: Set<string>,
  pvHintAtNode?: AIMove[]
): SearchResult {
  if (stats) stats.nodes++;
  const maximizing = state.currentPlayer === me;
  // Early cycle detection: if current position repeats within this PV path, return a biased draw
  try {
    const k = computeKey(state);
    const keyStr = `${(k.hi >>> 0)}:${(k.lo >>> 0)}`;
    if (repPath && repPath.has(keyStr)) {
      const bias = Math.floor(Math.max(0, Number(opts?.drawBias ?? 5)));
      const repScore = maximizing ? -bias : +bias;
      return { score: repScore, pv: [] };
    }
  } catch {}
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
  // Precompute current state's key string for repPath propagation
  let curKeyStrForRep: string | null = null;
  try {
    const kForRep = computeKey(state);
    curKeyStrForRep = `${(kForRep.hi >>> 0)}:${(kForRep.lo >>> 0)}`;
  } catch {}
  for (const m of ordered) {
    const nxt = applyMove(state, m);
    let child: SearchResult;
    // Build next repetition path including current state's key
    let nextRepPathLocal: Set<string> | undefined = repPath;
    if (curKeyStrForRep) {
      nextRepPathLocal = new Set<string>(repPath ? Array.from(repPath) : []);
      nextRepPathLocal.add(curKeyStrForRep);
    }
    if (first) {
      child = searchNode(nxt, depth - 1, alpha, beta, me, ply + 1, killers, history, stats, opts, nextRepPathLocal, pvHintAtNode?.slice(1));
      first = false;
    } else {
      if (usePVS) {
        // PVS: null-window search
        child = searchNode(nxt, depth - 1, alpha, alpha + 1, me, ply + 1, killers, history, stats, opts, nextRepPathLocal, undefined);
        if (maximizing ? child.score > alpha : child.score < beta) {
          child = searchNode(nxt, depth - 1, alpha, beta, me, ply + 1, killers, history, stats, opts, nextRepPathLocal, undefined);
        }
      } else {
        child = searchNode(nxt, depth - 1, alpha, beta, me, ply + 1, killers, history, stats, opts, nextRepPathLocal, undefined);
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
): { move: AIMove | null; score: number; pv: AIMove[]; rootMoves: Array<{ move: AIMove; score: number }>; avoidAppliedCount?: number; avoidAppliedWeight?: number } {
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

  const orderedBase = orderMoves(movesGen, { pvSig, hashSig, killers: killers[0], history });

  let bestMoveSel: AIMove | null = null;
  let bestScore = -Infinity;
  let bestPV: AIMove[] = [];
  const rootMoves: Array<{ move: AIMove; score: number }> = [];
  const candidates: Array<{ move: AIMove; score: number; pv: AIMove[] }> = [];
  // Metrics: how many root children got penalized and total weight applied
  let avoidAppliedCount = 0;
  let avoidAppliedWeight = 0;

  // Build a fast lookup for avoided keys; prefer weighted list if provided
  let avoidMap: Map<string, number> | null = null;
  const hasAvoidList = Array.isArray(opts?.avoidList) && (opts!.avoidList as any[]).length > 0;
  if (hasAvoidList) {
    avoidMap = new Map<string, number>();
    for (const entry of (opts!.avoidList as Array<{ hi: number; lo: number; weight: number }>)) {
      const keyStr = `${(entry.hi >>> 0)}:${(entry.lo >>> 0)}`;
      const w = Number(entry.weight) || 0;
      // If duplicate keys appear, keep the max weight
      avoidMap.set(keyStr, Math.max(w, avoidMap.get(keyStr) ?? 0));
    }
  } else {
    const avoidSet: Set<string> = new Set(
      (opts?.avoidKeys ?? []).map((k) => `${(k.hi >>> 0)}:${(k.lo >>> 0)}`)
    );
    if (avoidSet.size > 0) {
      avoidMap = new Map<string, number>();
      const penalty = Math.max(0, Math.floor(opts?.avoidPenalty ?? 50));
      for (const s of avoidSet) avoidMap.set(s, penalty);
    }
  }

  // Novelty bonus lookup (root scope): if provided, add a small bonus when child leads to unseen key
  const noveltySet: Set<string> | null = (opts?.noveltyKeys && (opts.noveltyKeys as any[]).length > 0)
    ? new Set<string>((opts!.noveltyKeys as Array<{ hi: number; lo: number }>).map(k => `${(k.hi >>> 0)}:${(k.lo >>> 0)}`))
    : null;
  const noveltyBonus = Math.floor(Math.max(0, Number(opts?.noveltyBonus ?? 0)));

  // Build jittered ordering under repetition risk (avoidMap set)
  let ordered: AIMove[] = orderedBase;
  const wantJitter = (opts?.rootJitter !== false);
  if (wantJitter && avoidMap && avoidMap.size > 0) {
    // Apply a light, seedable neighbor-swap jitter to preserve overall ordering quality
    let seed = (opts?.randSeed ?? 0) >>> 0;
    const rnd = (): number => {
      if (!seed) return Math.random();
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return (seed >>> 8) / 0xFFFFFF;
    };
    const p = Math.max(0, Math.min(1, Number(opts?.rootJitterProb ?? 0.1)));
    const arr = orderedBase.slice();
    for (let i = 1; i < arr.length; i++) {
      if (rnd() < p) {
        // swap with previous to introduce minimal jitter
        const tmp = arr[i - 1];
        arr[i - 1] = arr[i];
        arr[i] = tmp;
      }
    }
    ordered = arr;
  }

  if (opts?.shouldStop && opts.shouldStop()) {
    const m0 = ordered[0];
    const score0 = evaluate(applyMove(state, m0), me);
    return { move: m0, score: score0, pv: [m0], rootMoves: [{ move: m0, score: score0 }] };
  }

  const usePVSRoot = flagsRoot.pvsEnabled;
  let first = true;
  // Prepare repPath for cycle detection: include root state's key
  const rootRepPath: Set<string> = new Set<string>();
  try {
    const rootKeyStr = `${(key.hi >>> 0)}:${(key.lo >>> 0)}`;
    rootRepPath.add(rootKeyStr);
  } catch {}
  for (const m of ordered) {
    const nxt = applyMove(state, m);
    // Extend repetition path with current state's key for child
    const nextRepPath: Set<string> | undefined = rootRepPath;
    // LMR-style depth adjustment at root under repetition risk:
    // if the child state is in avoidMap (repetitive), search slightly shallower; otherwise keep baseline.
    let dChild = Math.max(0, depth - 1);
    const wantLMR = (opts?.rootLMR !== false);
    if (wantLMR && avoidMap && avoidMap.size > 0) {
      const k = computeKey(nxt);
      const keyStr = `${(k.hi >>> 0)}:${(k.lo >>> 0)}`;
      if (avoidMap.has(keyStr)) {
        dChild = Math.max(0, depth - 2); // reduce more for repetitive states
      }
    }
    let res: SearchResult;
    if (first) {
      res = searchNode(nxt, dChild, alpha, beta, me, 1, killers, history, stats, opts, nextRepPath, opts?.pvHint?.slice(1));
      first = false;
    } else {
      if (usePVSRoot) {
        // PVS at root as well
        res = searchNode(nxt, dChild, alpha, alpha + 1, me, 1, killers, history, stats, opts, nextRepPath, undefined);
        if (res.score > alpha && res.score < beta) {
          res = searchNode(nxt, dChild, alpha, beta, me, 1, killers, history, stats, opts, nextRepPath, undefined);
        }
      } else {
        res = searchNode(nxt, dChild, alpha, beta, me, 1, killers, history, stats, opts, nextRepPath, undefined);
      }
    }
    // Apply repetition-avoidance penalty at the root, if enabled
    let childScore = res.score;
    if (avoidMap && avoidMap.size > 0) {
      const k = computeKey(nxt);
      const keyStr = `${(k.hi >>> 0)}:${(k.lo >>> 0)}`;
      const w = avoidMap.get(keyStr);
      if (typeof w === 'number' && w > 0) {
        childScore = childScore - w;
        avoidAppliedCount += 1;
        avoidAppliedWeight += w;
      }
    }
    // Apply novelty bonus if this child leads to a state not in the seen set
    if (noveltySet && noveltyBonus > 0) {
      const k = computeKey(nxt);
      const keyStr = `${(k.hi >>> 0)}:${(k.lo >>> 0)}`;
      if (!noveltySet.has(keyStr)) childScore = childScore + noveltyBonus;
    }
    rootMoves.push({ move: m, score: childScore });
    candidates.push({ move: m, score: childScore, pv: res.pv });
    if (childScore > bestScore) {
      bestScore = childScore;
      bestMoveSel = m;
      bestPV = [m, ...res.pv];
    }
    if (bestScore > alpha) alpha = bestScore;
    if (opts?.shouldStop && opts.shouldStop()) break;
  }
  // Optional: root diversification (epsilon-greedy) over Top-K by score
  if (opts && opts.diversify === 'epsilon') {
    const epsilon = Math.max(0, Math.min(1, Number(opts.epsilon ?? 0.15)));
    if (epsilon > 0 && candidates.length > 1) {
      const K = Math.max(2, Math.min(8, Math.floor(opts.rootTopK ?? 3)));
      const sorted = candidates.slice().sort((a, b) => b.score - a.score);
      const top = sorted.slice(0, Math.min(K, sorted.length));
      if (top.length >= 2) {
        // Seeded RNG (LCG) for reproducibility if randSeed provided
        let seed = (opts.randSeed ?? 0) >>> 0;
        const rnd = (): number => {
          if (!seed) return Math.random();
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          return (seed >>> 8) / 0xFFFFFF;
        };
        if (rnd() < epsilon) {
          // Prefer an alternative candidate different from the current best within Top-K
          const sigBest = makeSignature(bestMoveSel!);
          const alternatives = top.filter(c => makeSignature(c.move) !== sigBest);
          const pool = alternatives.length > 0 ? alternatives : top;
          const pick = pool[Math.floor(rnd() * pool.length)] || pool[0];
          if (pick) {
            bestMoveSel = pick.move;
            bestScore = pick.score;
            bestPV = [pick.move, ...pick.pv];
          }
        }
      }
    }
  }

  return { move: bestMoveSel, score: bestScore, pv: bestPV, rootMoves, avoidAppliedCount, avoidAppliedWeight };
}
