import type { GameState, Player } from '../game/types.ts';
import { goalRow } from '../game/rules.ts';
import { evaluate } from './eval.ts';
import { applyAIMove, generateMoves } from './moves.ts';
import type { AIMove, SearchParams, SearchResult, SearchConfig, TraceConfig, TraceEvent } from './types.ts';
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

type TTEntry = { depth: number; score: number; alpha: number; beta: number; best?: AIMove };

function moveKey(m: AIMove): string {
  return m.kind === 'pawn' ? `P:${m.to.row},${m.to.col}` : `W:${m.wall.o}:${m.wall.r},${m.wall.c}`;
}

function alphaBeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  rootPlayer: Player,
  deadline?: number,
  config?: SearchConfig,
  tt?: Map<string, TTEntry>,
  ply: number = 0,
  killers?: AIMove[][],
  history?: Map<string, number>,
  lastMove?: AIMove | null,
  qPlies: number = 0,
  tracer?: Tracer,
): ABResult {
  const maximizing = state.current === rootPlayer;
  // Enter node first so any early return still has a matching exit
  if (tracer) tracer.nodeEnter(depth, ply, alpha, beta, maximizing);

  // Time control
  if (deadline !== undefined && performance.now() >= deadline) {
    const score = evaluate(state, rootPlayer);
    if (tracer) tracer.emitNode({ type: 'eval', t: performance.now(), depth, ply, nodeId: tracer.peekNodeId(), score });
    if (tracer) tracer.nodeExit(depth, ply, score);
    return { score, pv: [], nodes: 1 };
  }

  const winner = isTerminal(state);
  if (winner) {
    const sign = winner === rootPlayer ? 1 : -1;
    const score = 1000 * sign;
    if (tracer) tracer.emitNode({ type: 'eval', t: performance.now(), depth, ply, nodeId: tracer.peekNodeId(), score });
    if (tracer) tracer.nodeExit(depth, ply, score);
    return { score, pv: [], nodes: 1 };
  }

  if (depth === 0) {
    // Quiescence-style extension: si el último movimiento fue valla y está activado, extendemos 1 ply
    if (config?.enableQuiescence && lastMove && lastMove.kind === 'wall' && qPlies < (config.quiescenceMaxPlies ?? 0)) {
      depth = 1; // extender una capa
      qPlies += 1;
    } else {
      const score = evaluate(state, rootPlayer);
      if (tracer) tracer.emitNode({ type: 'eval', t: performance.now(), depth, ply, nodeId: tracer.peekNodeId(), score });
      if (tracer) tracer.nodeExit(depth, ply, score);
      return { score, pv: [], nodes: 1 };
    }
  }

  let moves = generateMoves(state, config, false);
  if (moves.length === 0) {
    // No legal moves — extremely unlikely in Quoridor; fallback to evaluation
    const score = evaluate(state, rootPlayer);
    if (tracer) tracer.emitNode({ type: 'eval', t: performance.now(), depth, ply, nodeId: tracer.peekNodeId(), score });
    if (tracer) tracer.nodeExit(depth, ply, score);
    return { score, pv: [], nodes: 1 };
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
      if (tracer) tracer.emitNode({ type: 'tt_hit', t: performance.now(), depth, ply, nodeId: tracer.peekNodeId() });
      if (tracer) tracer.nodeExit(depth, ply, e.score);
      return { score: e.score, pv: [], nodes: 1 };
    }
  }

  // Move ordering enhancements: TT move first, then killer moves, then by existing heuristics and history
  let ttMove: AIMove | undefined;
  if (key && tt) {
    const e = tt.get(key);
    if (e && e.best) ttMove = e.best;
  }

  const killerSet = new Set<string>();
  const killersAtPly = (config?.enableKillerHeuristic ? (killers?.[ply] ?? []) : []);
  for (const km of killersAtPly) killerSet.add(moveKey(km));

  // Stable sort with priority: ttMove (3) > killer (2) > others (1), then history desc, then pawn advance
  const priorities = new Map<string, number>();
  if (ttMove) priorities.set(moveKey(ttMove), 3);
  if (config?.enableKillerHeuristic) {
    for (const km of killersAtPly) {
      if (!ttMove || moveKey(km) !== moveKey(ttMove)) priorities.set(moveKey(km), 2);
    }
  }

  const targetRow = goalRow(state.size, state.current);
  const sign = targetRow < state.pawns[state.current].row ? -1 : 1;
  const hist = config?.enableHistoryHeuristic ? (history ?? new Map<string, number>()) : new Map<string, number>();

  moves.sort((a, b) => {
    const pa = priorities.get(moveKey(a)) ?? 1;
    const pb = priorities.get(moveKey(b)) ?? 1;
    if (pa !== pb) return pb - pa; // higher priority first
    if (config?.enableHistoryHeuristic) {
      const ha = hist.get(moveKey(a)) ?? 0;
      const hb = hist.get(moveKey(b)) ?? 0;
      if (ha !== hb) return hb - ha;
    }
    if (config?.enableMoveOrdering && a.kind === 'pawn' && b.kind === 'pawn') {
      const da = sign * (a.to.row - state.pawns[state.current].row);
      const db = sign * (b.to.row - state.pawns[state.current].row);
      return db - da; // more progress first
    }
    if (a.kind !== b.kind) return a.kind === 'pawn' ? -1 : 1;
    return 0;
  });

  let idx = 0;
  for (const m of moves) {
    const next = applyAIMove(state, m);

    // PVS zero-window for non-first moves if enabled
    let localAlpha = alpha;
    let localBeta = beta;
    let res: ABResult;
    const doPVS = !!config?.enablePVS && idx > 0;
    const isKiller = killerSet.has(moveKey(m));
    // LMR: reduce depth for late, non-killer, non-tt moves
    let childDepth = depth - 1;
    if (config?.enableLMR && depth >= 3 && idx >= 3 && !isKiller && (!ttMove || moveKey(m) !== moveKey(ttMove))) {
      childDepth = Math.max(0, childDepth - 1);
    }

    if (doPVS) {
      if (maximizing) {
        localBeta = localAlpha + 1;
      } else {
        localAlpha = localBeta - 1;
      }
      res = alphaBeta(next, childDepth, localAlpha, localBeta, rootPlayer, deadline, config, tt, ply + 1, killers, history, m, qPlies, tracer);
      nodes += res.nodes; // contar la búsqueda de ventana estrecha
      const inWindow = res.score > alpha && res.score < beta;
      if (inWindow) {
        res = alphaBeta(next, childDepth, alpha, beta, rootPlayer, deadline, config, tt, ply + 1, killers, history, m, qPlies, tracer);
        nodes += res.nodes; // sólo sumamos la re-búsqueda completa
      }
    } else {
      res = alphaBeta(next, childDepth, alpha, beta, rootPlayer, deadline, config, tt, ply + 1, killers, history, m, qPlies, tracer);
      nodes += res.nodes;
    }
    // Nota: no volver a sumar res.nodes aquí para evitar doble conteo.
    if (maximizing) {
      if (res.score > bestScore || (config?.randomTieBreak && res.score === bestScore && Math.random() < 0.5)) {
        bestScore = res.score; bestPV = [m, ...res.pv];
        if (tracer) tracer.emitNode({ type: 'best_update', t: performance.now(), depth, ply, nodeId: tracer.peekNodeId(), move: m, score: bestScore });
      }
      if (bestScore > alpha) alpha = bestScore;
      if (config?.enableAlphaBeta !== false && alpha >= beta) {
        // Beta cutoff: update killers and history
        if (config?.enableKillerHeuristic && killers) {
          const arr = killers[ply] ?? [];
          const mk = moveKey(m);
          if (!arr.some(k => moveKey(k) === mk)) {
            const nextArr = [m, ...arr].slice(0, 2);
            killers[ply] = nextArr;
          }
        }
        if (config?.enableHistoryHeuristic && history) {
          const mk = moveKey(m);
          history.set(mk, (history.get(mk) ?? 0) + depth * depth);
        }
        if (tracer) tracer.emitNode({ type: 'cutoff', t: performance.now(), depth, ply, nodeId: tracer.peekNodeId(), reason: 'beta', move: m, alpha, beta });
        break; // beta cut
      }
    } else {
      if (res.score < bestScore || (config?.randomTieBreak && res.score === bestScore && Math.random() < 0.5)) {
        bestScore = res.score; bestPV = [m, ...res.pv];
        if (tracer) tracer.emitNode({ type: 'best_update', t: performance.now(), depth, ply, nodeId: tracer.peekNodeId(), move: m, score: bestScore });
      }
      if (bestScore < beta) beta = bestScore;
      if (config?.enableAlphaBeta !== false && alpha >= beta) {
        // Alpha cutoff: update killers and history
        if (config?.enableKillerHeuristic && killers) {
          const arr = killers[ply] ?? [];
          const mk = moveKey(m);
          if (!arr.some(k => moveKey(k) === mk)) {
            const nextArr = [m, ...arr].slice(0, 2);
            killers[ply] = nextArr;
          }
        }
        if (config?.enableHistoryHeuristic && history) {
          const mk = moveKey(m);
          history.set(mk, (history.get(mk) ?? 0) + depth * depth);
        }
        if (tracer) tracer.emitNode({ type: 'cutoff', t: performance.now(), depth, ply, nodeId: tracer.peekNodeId(), reason: 'alpha', move: m, alpha, beta });
        break; // alpha cut
      }
    }
    idx++;
  }

  if (key && tt) {
    tt.set(key, { depth, score: bestScore, alpha, beta, best: bestPV.length ? bestPV[0] : undefined });
    // keep map bounded
    if (tt.size > (config?.ttSize ?? 32768)) {
      // naive eviction: delete first inserted
      const it = tt.keys().next();
      if (!it.done) tt.delete(it.value);
    }
  }

  if (tracer) tracer.nodeExit(depth, ply, bestScore, bestPV[0]);
  return { score: bestScore, pv: bestPV, nodes: nodes + 1 };
}

type Tracer = {
  cfg: TraceConfig | undefined;
  onTrace?: (ev: TraceEvent | TraceEvent[]) => void;
  nextId: number;
  parentStack: number[];
  sampledStack: boolean[];
  sample(): boolean;
  emit(ev: TraceEvent | TraceEvent[]): void;
  emitNode(ev: TraceEvent): void;
  nodeEnter(depth: number, ply: number, alpha: number, beta: number, maximizing: boolean): void;
  nodeExit(depth: number, ply: number, score: number, bestMove?: AIMove): void;
  peekNodeId(): number;
};

function makeTracer(cfg?: TraceConfig, onTrace?: (ev: TraceEvent | TraceEvent[]) => void): Tracer | undefined {
  if (!cfg || !cfg.enabled) return undefined;
  const t: Tracer = {
    cfg,
    onTrace,
    nextId: 1,
    parentStack: [],
    sampledStack: [],
    sample() {
      const rate = typeof cfg.sampleRate === 'number' ? Math.max(0, Math.min(1, cfg.sampleRate)) : 0;
      return Math.random() < rate;
    },
    emit(ev) {
      if (!this.onTrace) return;
      if (Array.isArray(ev)) {
        if (ev.length === 0) return;
        this.onTrace(ev);
      } else {
        this.onTrace(ev);
      }
    },
    emitNode(ev) {
      // Only emit if current node is sampled
      if (!this.sampledStack.length) return; // outside node context; ignore
      if (!this.sampledStack[this.sampledStack.length - 1]) return;
      this.emit(ev);
    },
    nodeEnter(depth, ply, alpha, beta, maximizing) {
      const parentId = this.parentStack.length ? this.parentStack[this.parentStack.length - 1] : undefined;
      const nodeId = this.nextId++;
      this.parentStack.push(nodeId);
      const withinDepth = this.cfg?.maxDepth === undefined || ply <= this.cfg.maxDepth;
      const sampled = withinDepth && this.sample();
      this.sampledStack.push(sampled);
      if (sampled) {
        this.emit({ type: 'node_enter', t: performance.now(), depth, ply, nodeId, parentId, alpha, beta, maximizing });
      }
    },
    nodeExit(depth, ply, score, bestMove) {
      const nodeId = this.parentStack.pop() ?? 0;
      const sampled = this.sampledStack.pop() ?? false;
      if (sampled) {
        this.emit({ type: 'node_exit', t: performance.now(), depth, ply, nodeId, score, bestMove });
      }
    },
    peekNodeId() { return this.parentStack.length ? this.parentStack[this.parentStack.length - 1] : 0; },
  };
  return t;
}

export function searchBestMove(state: GameState, params: SearchParams, rootPlayer?: Player): SearchResult {
  const start = performance.now();
  const rp: Player = rootPlayer ?? state.current;
  const deadline = params.deadlineMs;
  const cfg = params.config;
  const tracer = makeTracer(params.traceConfig, params.onTrace);
  const tt: Map<string, TTEntry> | undefined = cfg?.enableTT ? new Map() : undefined;
  // Data for enhanced move ordering
  const killers: AIMove[][] = [];
  const history: Map<string, number> = new Map();

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
  let prevScore: number | null = null;

  // Iterative deepening (optional): dStart..maxDepth or until deadline
  for (let d = dStart; d <= dEnd; d++) {
    if (tracer) tracer.emit({ type: 'iter_start', t: performance.now(), depth: d });
    let bestAtD: AIMove | null = null;
    let bestScoreAtD = -Infinity;
    let bestPVAtD: AIMove[] = [];
    let nodesAtD = 0;

    // Aspiration windows around previous depth's score
    let rootAlpha = -Infinity;
    let rootBeta = Infinity;
    if (cfg?.enableAspirationWindows && prevScore !== null && Number.isFinite(prevScore)) {
      const window = cfg.aspirationWindow ?? 0.5;
      rootAlpha = prevScore - window;
      rootBeta = prevScore + window;
    }

    for (const m of rootMoves) {
      if (deadline !== undefined) {
        const now = performance.now();
        if (now >= deadline) break;
      }
      const next = applyAIMove(state, m);
      const res = alphaBeta(next, d - 1, rootAlpha, rootBeta, rp, deadline, cfg, tt, 1, killers, history, m, 0, tracer);
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
      prevScore = bestScoreAtD;
    }

    if (deadline !== undefined) {
      const now = performance.now();
      if (now >= deadline) break;
      if (cfg?.hardTimeLimit && (deadline - now) <= 0) break;
    }
    if (tracer) tracer.emit({ type: 'iter_end', t: performance.now(), depth: d });
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
