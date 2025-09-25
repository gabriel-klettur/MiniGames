import type { GameState, Player } from '../../game/types';
import { generateAllMoves, applyMove } from '../moves';
import type { AIMove } from '../moves';
import { evaluate } from '../evaluate';
import { computeKey } from '../zobrist';
import { TT, TTFlag } from '../tt';
import { makeSignature, type MoveSignature } from '../signature';

type Killers = Array<[MoveSignature | 0, MoveSignature | 0]>; // two per ply
type HistoryMap = Map<MoveSignature, number>;

function isTactical(m: AIMove): boolean {
  return (m.recovers?.length ?? 0) > 0;
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
    return { score: evaluate(state, me), pv: [] };
  }

  // TT probe
  const key = computeKey(state);
  if (stats) stats.ttReads = (stats.ttReads ?? 0) + 1;
  let hashSig: MoveSignature | undefined = undefined;
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

  let first = true;
  for (const m of ordered) {
    const nxt = applyMove(state, m);
    let child: SearchResult;
    if (first) {
      child = searchNode(nxt, depth - 1, alpha, beta, me, ply + 1, killers, history, stats, opts, pvHintAtNode?.slice(1));
      first = false;
    } else {
      // PVS: null-window search
      child = searchNode(nxt, depth - 1, alpha, alpha + 1, me, ply + 1, killers, history, stats, opts, undefined);
      if (maximizing ? child.score > alpha : child.score < beta) {
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
        TT.store(key, depth, clampFinite(bestScore), TTFlag.LOWER, bestMoveSig);
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
        TT.store(key, depth, clampFinite(bestScore), TTFlag.UPPER, bestMoveSig);
        return { score: bestScore, pv: bestPV };
      }
    }

    if (opts?.shouldStop && opts.shouldStop()) break;
  }

  // Store TT with EXACT/UPPER/LOWER depending on final window
  let flag: TTFlag = TTFlag.EXACT;
  if (bestScore <= alpha) flag = TTFlag.UPPER; // fail-low
  else if (bestScore >= beta) flag = TTFlag.LOWER; // fail-high
  TT.store(key, depth, clampFinite(bestScore), flag, bestMoveSig);
  return { score: bestScore, pv: bestPV };
}

export function bestMove(
  state: GameState,
  depth: number,
  stats?: SearchStats,
  opts?: SearchOptions
): { move: AIMove | null; score: number; pv: AIMove[]; rootMoves: Array<{ move: AIMove; score: number }> } {
  const me: Player = state.currentPlayer;
  const movesGen = generateAllMoves(state);
  if (movesGen.length === 0) return { move: null, score: evaluate(state, me), pv: [], rootMoves: [] };

  // Prepare helpers for ordering at root
  const pvSig = opts?.pvHint && opts.pvHint.length > 0 ? makeSignature(opts.pvHint[0]) : undefined;
  const key = computeKey(state);
  let hashSig: MoveSignature | undefined = undefined;
  const probe = TT.probe(key);
  if (probe) hashSig = probe.bestMove || undefined;

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

  if (opts?.shouldStop && opts.shouldStop()) {
    const m0 = ordered[0];
    const score0 = evaluate(applyMove(state, m0), me);
    return { move: m0, score: score0, pv: [m0], rootMoves: [{ move: m0, score: score0 }] };
  }

  let first = true;
  for (const m of ordered) {
    const nxt = applyMove(state, m);
    let res: SearchResult;
    if (first) {
      res = searchNode(nxt, Math.max(0, depth - 1), alpha, beta, me, 1, killers, history, stats, opts, opts?.pvHint?.slice(1));
      first = false;
    } else {
      // PVS at root as well
      res = searchNode(nxt, Math.max(0, depth - 1), alpha, alpha + 1, me, 1, killers, history, stats, opts, undefined);
      if (res.score > alpha && res.score < beta) {
        res = searchNode(nxt, Math.max(0, depth - 1), alpha, beta, me, 1, killers, history, stats, opts, undefined);
      }
    }
    rootMoves.push({ move: m, score: res.score });
    if (res.score > bestScore) {
      bestScore = res.score;
      bestMoveSel = m;
      bestPV = [m, ...res.pv];
    }
    if (bestScore > alpha) alpha = bestScore;
    if (opts?.shouldStop && opts.shouldStop()) break;
  }
  return { move: bestMoveSel, score: bestScore, pv: bestPV, rootMoves };
}
