import type { GameState } from '../game/types';
import type { AIMove } from './moves';
import { generateAllMoves, applyMove } from './moves';
import { evaluate } from './evaluate';
import { computeStateKey } from './hash';
import { GlobalTT, type TTEntry } from './tt';

export type Player = 1 | 2;

export interface SearchOptions {
  enableTT?: boolean;
  failSoft?: boolean;
  preferHashMove?: boolean;
  enableKillers?: boolean;
  enableHistory?: boolean;
  enablePVS?: boolean;
  enableAspiration?: boolean;
  aspirationDelta?: number; // window half-size around prev score
  prevScore?: number; // previous iteration score (for aspiration)
}

const defaultOptions: Required<SearchOptions> = {
  enableTT: true,
  failSoft: true,
  preferHashMove: true,
  enableKillers: false,
  enableHistory: false,
  enablePVS: false,
  enableAspiration: false,
  aspirationDelta: 25,
  prevScore: 0,
};

function moveKey(m: AIMove): string {
  if (m.kind !== 'merge') return JSON.stringify(m);
  const a = m.sourceId < m.targetId ? m.sourceId : m.targetId;
  const b = m.sourceId < m.targetId ? m.targetId : m.sourceId;
  return `${a}+${b}`;
}

function orderMoves(
  state: GameState,
  moves: AIMove[],
  preferred?: AIMove | null,
  preferHashMove: boolean = true,
  killersAtPly?: Set<string> | null,
  history?: Map<string, number> | null,
  historyPlayer?: Player,
): AIMove[] {
  // Heurística simple de ordenamiento:
  // - Preferir merges que produzcan torres más altas
  // - Si los heights son iguales (o mismo top), mantener orden estable
  const byId: Record<string, { height: number }> = Object.fromEntries(
    state.towers.map((t) => [t.id, { height: t.height }])
  );
  const prefKey = preferred ? moveKey(preferred) : null;
  return moves
    .slice()
    .sort((a, b) => {
      // 0) Hash move (de TT) primero si existe y está habilitado
      if (preferHashMove && prefKey) {
        const ak = moveKey(a) === prefKey;
        const bk = moveKey(b) === prefKey;
        if (ak !== bk) return ak ? -1 : 1;
      }
      // 1) Killers por ply
      if (killersAtPly && killersAtPly.size > 0) {
        const ak = killersAtPly.has(moveKey(a));
        const bk = killersAtPly.has(moveKey(b));
        if (ak !== bk) return ak ? -1 : 1;
      }
      // 2) History heuristic por jugador
      if (history && historyPlayer) {
        const pa = history.get(`${historyPlayer}:${moveKey(a)}`) || 0;
        const pb = history.get(`${historyPlayer}:${moveKey(b)}`) || 0;
        if (pa !== pb) return pb - pa; // mayor score primero
      }
      const ah = (byId[a.sourceId]?.height ?? 0) + (byId[a.targetId]?.height ?? 0);
      const bh = (byId[b.sourceId]?.height ?? 0) + (byId[b.targetId]?.height ?? 0);
      if (ah !== bh) return bh - ah;
      // Pequeña preferencia por usar como fuente la torre más baja (libera opciones)
      const asrc = byId[a.sourceId]?.height ?? 0;
      const bsrc = byId[b.sourceId]?.height ?? 0;
      if (asrc !== bsrc) return asrc - bsrc;
      return 0;
    });
}

export interface SearchStats { nodes: number }
export interface SearchResult { score: number; pv: AIMove[] }

interface SearchContext {
  killers: Map<number, string[]>; // ply -> [moveKey, ...] (máx 2)
  history: Map<string, number>;   // `${player}:${moveKey}` -> score
}

function alphabeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  me: Player,
  stats: SearchStats | undefined,
  opts: Required<SearchOptions>,
  ply: number,
  ctx: SearchContext,
): SearchResult {
  if (stats) stats.nodes++;
  const maximizing = state.currentPlayer === me;
  if (depth === 0) {
    return { score: evaluate(state, me), pv: [] };
  }

  // TT probe (fail-soft compatible) si está habilitado
  const key = computeStateKey(state);
  const tt = opts.enableTT ? GlobalTT.get(key) : undefined;
  const alphaOrig = alpha;
  const betaOrig = beta;
  let hashMove: AIMove | null = null;
  if (tt && tt.depth >= depth) {
    if (tt.flag === 'EXACT') {
      return { score: tt.value, pv: [] };
    } else if (tt.flag === 'LOWER') {
      alpha = Math.max(alpha, tt.value);
    } else if (tt.flag === 'UPPER') {
      beta = Math.min(beta, tt.value);
    }
    if (alpha >= beta) {
      return { score: tt.value, pv: [] };
    }
    if (tt.best) hashMove = tt.best;
  }

  const killersArr = ctx.killers.get(ply) || [];
  const killersSet = killersArr.length ? new Set(killersArr) : null;
  const moves = orderMoves(
    state,
    generateAllMoves(state),
    hashMove,
    opts.preferHashMove,
    opts.enableKillers ? killersSet : null,
    opts.enableHistory ? ctx.history : null,
    opts.enableHistory ? state.currentPlayer : undefined,
  );
  if (moves.length === 0) {
    return { score: evaluate(state, me), pv: [] };
  }

  if (maximizing) {
    let bestScore = -Infinity;
    let bestPV: AIMove[] = [];
    let bestMv: AIMove | undefined = undefined;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      const nxt = applyMove(state, m);
      let child: SearchResult;
      if (opts.enablePVS && i > 0 && depth > 1) {
        // Null-window search first
        child = alphabeta(nxt, depth - 1, alpha, alpha + 1, me, stats, opts, ply + 1, ctx);
        // If it improves over alpha and is within beta, re-search full window
        if (child.score > alpha && child.score < beta) {
          child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
        }
      } else {
        child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
      }
      if (child.score > bestScore) {
        bestScore = child.score;
        bestPV = [m, ...child.pv];
        bestMv = m;
      }
      // Ventana: fail-soft (child.score) u hard (bestScore)
      alpha = Math.max(alpha, opts.failSoft ? child.score : bestScore);
      if (alpha >= beta) {
        // Killer y History
        if (opts.enableKillers && bestMv) {
          const mk = moveKey(bestMv);
          const arr = ctx.killers.get(ply) || [];
          if (!arr.includes(mk)) arr.unshift(mk);
          if (arr.length > 2) arr.length = 2;
          ctx.killers.set(ply, arr);
        }
        if (opts.enableHistory && bestMv) {
          const mk = moveKey(bestMv);
          const keyH = `${state.currentPlayer}:${mk}`;
          const bonus = depth * depth;
          ctx.history.set(keyH, (ctx.history.get(keyH) || 0) + bonus);
        }
        break;
      }
    }
    // Store TT entry si está habilitado
    if (opts.enableTT && bestMv !== undefined) {
      const entry: TTEntry = {
        key,
        depth,
        value: bestScore,
        flag: bestScore <= alphaOrig ? 'UPPER' : bestScore >= betaOrig ? 'LOWER' : 'EXACT',
        best: bestMv,
      };
      GlobalTT.set(entry);
    }
    return { score: bestScore, pv: bestPV };
  } else {
    let bestScore = +Infinity;
    let bestPV: AIMove[] = [];
    let bestMv: AIMove | undefined = undefined;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      const nxt = applyMove(state, m);
      let child: SearchResult;
      if (opts.enablePVS && i > 0 && depth > 1) {
        // Null-window for minimizing side: [beta-1, beta]
        child = alphabeta(nxt, depth - 1, beta - 1, beta, me, stats, opts, ply + 1, ctx);
        if (child.score < beta && child.score > alpha) {
          child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
        }
      } else {
        child = alphabeta(nxt, depth - 1, alpha, beta, me, stats, opts, ply + 1, ctx);
      }
      if (child.score < bestScore) {
        bestScore = child.score;
        bestPV = [m, ...child.pv];
        bestMv = m;
      }
      // Ventana: fail-soft (child.score) u hard (bestScore)
      beta = Math.min(beta, opts.failSoft ? child.score : bestScore);
      if (alpha >= beta) {
        // Killer y History
        if (opts.enableKillers && bestMv) {
          const mk = moveKey(bestMv);
          const arr = ctx.killers.get(ply) || [];
          if (!arr.includes(mk)) arr.unshift(mk);
          if (arr.length > 2) arr.length = 2;
          ctx.killers.set(ply, arr);
        }
        if (opts.enableHistory && bestMv) {
          const mk = moveKey(bestMv);
          const keyH = `${state.currentPlayer}:${mk}`;
          const bonus = depth * depth;
          ctx.history.set(keyH, (ctx.history.get(keyH) || 0) + bonus);
        }
        break;
      }
    }
    // Store TT entry si está habilitado
    if (opts.enableTT && bestMv !== undefined) {
      const entry: TTEntry = {
        key,
        depth,
        value: bestScore,
        flag: bestScore <= alphaOrig ? 'UPPER' : bestScore >= betaOrig ? 'LOWER' : 'EXACT',
        best: bestMv,
      };
      GlobalTT.set(entry);
    }
    return { score: bestScore, pv: bestPV };
  }
}

export function bestMove(state: GameState, depth: number, stats?: SearchStats, options?: SearchOptions): { move: AIMove | null; score: number; pv: AIMove[]; rootMoves: Array<{ move: AIMove; score: number }> } {
  const me: Player = state.currentPlayer;
  // Root hash move preferred if any
  const opts: Required<SearchOptions> = { ...defaultOptions, ...(options || {}) };
  const tt = opts.enableTT ? GlobalTT.get(computeStateKey(state)) : undefined;
  const ctx: SearchContext = { killers: new Map(), history: new Map() };
  const moves = orderMoves(
    state,
    generateAllMoves(state),
    tt?.best ?? null,
    opts.preferHashMove,
    null,
    opts.enableHistory ? ctx.history : null,
    opts.enableHistory ? state.currentPlayer : undefined,
  );
  if (moves.length === 0) return { move: null, score: evaluate(state, me), pv: [], rootMoves: [] };

  const runRootSearch = (a0: number, b0: number) => {
    let best: { move: AIMove; score: number; pv: AIMove[] } | null = null;
    let alpha = a0;
    const beta = b0;
    const rootMoves: Array<{ move: AIMove; score: number }> = [];
    for (const m of moves) {
      const nxt = applyMove(state, m);
      const res = alphabeta(nxt, Math.max(0, depth - 1), alpha, beta, me, stats, opts, 1, ctx);
      rootMoves.push({ move: m, score: res.score });
      if (!best || res.score > best.score) {
        best = { move: m, score: res.score, pv: [m, ...res.pv] };
        alpha = Math.max(alpha, opts.failSoft ? res.score : best.score);
      }
    }
    return { best, rootMoves, a: a0, b: b0 };
  };

  // Aspiration: try narrow window around prevScore, then fallback to full window on fail low/high
  let a = -Infinity;
  let b = +Infinity;
  if (opts.enableAspiration && Number.isFinite(opts.prevScore)) {
    const d = Math.max(1, opts.aspirationDelta);
    a = (opts.prevScore as number) - d;
    b = (opts.prevScore as number) + d;
  }
  let attempt = runRootSearch(a, b);
  let best = attempt.best;
  let rootMoves = attempt.rootMoves;
  if (
    opts.enableAspiration && best && (best.score <= a || best.score >= b)
  ) {
    // Re-search with full window
    a = -Infinity; b = +Infinity;
    attempt = runRootSearch(a, b);
    best = attempt.best;
    rootMoves = attempt.rootMoves;
  }
  return { move: best?.move ?? null, score: best?.score ?? -Infinity, pv: best?.pv ?? [], rootMoves };
}
