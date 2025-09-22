import type { GameState, Player } from '../game/types.ts';
import { goalRow } from '../game/rules.ts';
import { evaluate } from './eval.ts';
import { applyAIMove, generateMoves } from './moves.ts';
import type { AIMove, SearchParams, SearchResult, SearchConfig } from './types.ts';
import { stateKey } from './hash.ts';

interface ABResult {
  score: number;
  pv: AIMove[];
  nodes: number;
}

function isTerminal(state: GameState): Player | null {
  const size = state.size;
  if (state.pawns.L.row === goalRow(size, 'L')) return 'L';
  if (state.pawns.D.row === goalRow(size, 'D')) return 'D';
  return null;
}

type TTEntry = { depth: number; score: number; alpha: number; beta: number };

function alphaBeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  rootPlayer: Player,
  deadline?: number,
  config?: SearchConfig,
  tt?: Map<string, TTEntry>,
): ABResult {
  // Time control
  if (deadline !== undefined && performance.now() >= deadline) {
    return { score: evaluate(state, rootPlayer), pv: [], nodes: 1 };
  }

  const winner = isTerminal(state);
  if (winner) {
    const sign = winner === rootPlayer ? 1 : -1;
    return { score: 1000 * sign, pv: [], nodes: 1 };
  }

  if (depth === 0) {
    return { score: evaluate(state, rootPlayer), pv: [], nodes: 1 };
  }

  const maximizing = state.current === rootPlayer;
  const moves = generateMoves(state, config, false);
  if (moves.length === 0) {
    // No legal moves — extremely unlikely in Quoridor; fallback to evaluation
    return { score: evaluate(state, rootPlayer), pv: [], nodes: 1 };
  }

  let bestScore = maximizing ? -Infinity : Infinity;
  let bestPV: AIMove[] = [];
  let nodes = 0;

  // Transposition table lookup (very simple, no flags)
  const key = config?.enableTT ? stateKey(state) : undefined;
  if (key && tt) {
    const e = tt.get(key);
    if (e && e.depth >= depth && e.alpha <= alpha && e.beta >= beta) {
      // Use stored score as exact within current window
      return { score: e.score, pv: [], nodes: 1 };
    }
  }

  for (const m of moves) {
    const next = applyAIMove(state, m);
    const res = alphaBeta(next, depth - 1, alpha, beta, rootPlayer, deadline, config, tt);
    nodes += res.nodes;
    if (maximizing) {
      if (res.score > bestScore || (config?.randomTieBreak && res.score === bestScore && Math.random() < 0.5)) {
        bestScore = res.score; bestPV = [m, ...res.pv];
      }
      if (bestScore > alpha) alpha = bestScore;
      if (config?.enableAlphaBeta !== false && alpha >= beta) break; // beta cut
    } else {
      if (res.score < bestScore || (config?.randomTieBreak && res.score === bestScore && Math.random() < 0.5)) {
        bestScore = res.score; bestPV = [m, ...res.pv];
      }
      if (bestScore < beta) beta = bestScore;
      if (config?.enableAlphaBeta !== false && alpha >= beta) break; // alpha cut
    }
  }

  if (key && tt) {
    tt.set(key, { depth, score: bestScore, alpha, beta });
    // keep map bounded
    if (tt.size > (config?.ttSize ?? 32768)) {
      // naive eviction: delete first inserted
      const it = tt.keys().next();
      if (!it.done) tt.delete(it.value);
    }
  }

  return { score: bestScore, pv: bestPV, nodes: nodes + 1 };
}

export function searchBestMove(state: GameState, params: SearchParams, rootPlayer?: Player): SearchResult {
  const start = performance.now();
  const rp: Player = rootPlayer ?? state.current;
  const deadline = params.deadlineMs;
  const cfg = params.config;
  const tt: Map<string, TTEntry> | undefined = cfg?.enableTT ? new Map() : undefined;

  let rootMoves = generateMoves(state, cfg, true);
  if (cfg?.randomTieBreak) {
    // slight shuffle to vary equal scores
    rootMoves = rootMoves.sort(() => Math.random() - 0.5);
  }
  let globalBest: AIMove | null = null;
  let globalScore = -Infinity;
  let globalPV: AIMove[] = [];
  let globalDepthReached = 0;
  let totalNodes = 0;
  const rootScores: Array<{ move: AIMove; score: number }> = [];

  const maxDepth = params.maxDepth;
  const dStart = cfg?.enableIterative === false ? maxDepth : 1;
  const dEnd = maxDepth;

  // Iterative deepening (optional): dStart..maxDepth or until deadline
  for (let d = dStart; d <= dEnd; d++) {
    let bestAtD: AIMove | null = null;
    let bestScoreAtD = -Infinity;
    let bestPVAtD: AIMove[] = [];
    let nodesAtD = 0;

    for (const m of rootMoves) {
      if (deadline !== undefined) {
        const now = performance.now();
        if (now >= deadline) break;
      }
      const next = applyAIMove(state, m);
      const res = alphaBeta(next, d - 1, -Infinity, Infinity, rp, deadline, cfg, tt);
      nodesAtD += res.nodes;
      rootScores.push({ move: m, score: res.score });
      if (res.score > bestScoreAtD) { bestScoreAtD = res.score; bestAtD = m; bestPVAtD = [m, ...res.pv]; }
    }

    if (bestAtD !== null) {
      globalBest = bestAtD;
      globalScore = bestScoreAtD;
      globalPV = bestPVAtD;
      globalDepthReached = d;
      totalNodes += nodesAtD;
    }

    if (deadline !== undefined) {
      const now = performance.now();
      if (now >= deadline) break;
      if (cfg?.hardTimeLimit && (deadline - now) <= 0) break;
    }
  }

  const elapsedMs = performance.now() - start;
  return {
    best: globalBest,
    score: Number.isFinite(globalScore) ? globalScore : evaluate(state, rp),
    depthReached: globalDepthReached,
    nodes: totalNodes,
    elapsedMs,
    pv: globalPV,
    rootMoves: rootScores,
  };
}
