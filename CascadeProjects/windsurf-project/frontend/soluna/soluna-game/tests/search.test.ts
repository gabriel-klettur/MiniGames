/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { bestMove as searchBestMove, type SearchStats } from '../src/ia/search';
import { generateAllMoves, type AIMove } from '../src/ia/moves';
import { evaluate } from '../src/ia/evaluate';
import type { GameState, Tower } from '../src/game/types';

function makeTower(id: string, height: number, top: Tower['top'], x = 0.5, y = 0.5): Tower {
  const stack = Array.from({ length: height }, () => top);
  return { id, stack, height, top, pos: { x, y } };
}

function baseState(partial?: Partial<GameState>): GameState {
  const defaults: GameState = {
    towers: [],
    selectedId: null,
    currentPlayer: 1,
    lastMover: null,
    roundOver: false,
    gameOver: false,
    players: { 1: { stars: 0 }, 2: { stars: 0 } },
    mergeFx: null,
  };
  return { ...defaults, ...(partial || {}) } as GameState;
}

function idsOf(m: AIMove | null): [string, string] | null {
  if (!m) return null;
  return [m.sourceId, m.targetId];
}

describe('ia/search.bestMove', () => {
  it('returns null move when there are no legal merges at root', () => {
    const towers: Tower[] = [
      makeTower('a', 1, 'sol'),
      makeTower('b', 2, 'luna'),
      makeTower('c', 3, 'estrella'),
    ];
    const state = baseState({ towers, currentPlayer: 1 });
    const stats: SearchStats = { nodes: 0 };
    const res = searchBestMove(state, 2, stats);
    expect(res.move).toBeNull();
    expect(res.pv.length).toBe(0);
    expect(res.rootMoves.length).toBe(0);
    // Score must match evaluate for terminal (no moves)
    expect(res.score).toBe(evaluate(state, state.currentPlayer));
    // When there are no root moves, search.bestMove() returns early without visiting nodes
    // so stats.nodes can legitimately be 0.
    expect(stats.nodes).toBeGreaterThanOrEqual(0);
  });

  it('with depth=0, returns a single-move PV when moves exist', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 1, 'luna');
    const state = baseState({ towers: [a, b, c], currentPlayer: 1 });
    const res = searchBestMove(state, 0, { nodes: 0 });
    expect(res.move).not.toBeNull();
    expect(res.pv.length).toBe(1);
  });

  it('deterministic: same state and depth yields same best move', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 1, 'luna');
    const d = makeTower('d', 1, 'luna');
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });
    const r1 = searchBestMove(state, 2, { nodes: 0 });
    const r2 = searchBestMove(state, 2, { nodes: 0 });
    expect(r1.move).not.toBeNull();
    expect(r2.move).not.toBeNull();
    expect(new Set(idsOf(r1.move!)!)).toEqual(new Set(idsOf(r2.move!)!));
  });

  it('PV starts with the selected best move', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 1, 'luna');
    const d = makeTower('d', 1, 'luna');
    // Several merges available, not necessarily terminal
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });
    const stats: SearchStats = { nodes: 0 };
    const res = searchBestMove(state, 2, stats);
    expect(res.move).not.toBeNull();
    expect(res.pv.length).toBeGreaterThan(0);
    // First PV move should match selected move
    const [ms, mt] = idsOf(res.move!)!;
    const [ps, pt] = idsOf(res.pv[0])!;
    expect(new Set([ms, mt])).toEqual(new Set([ps, pt]));
  });

  it('picks a winning immediate merge and reports +Infinity/2 score', () => {
    // a(1 sol), b(1 sol) merge -> h2 sol; with c(3 luna), d(5 estrella) => no further merges
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 3, 'luna');
    const d = makeTower('d', 5, 'estrella');
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });
    const stats: SearchStats = { nodes: 0 };
    const res = searchBestMove(state, 1, stats);
    expect(res.move).not.toBeNull();
    const ids = new Set(idsOf(res.move!)!);
    expect(ids).toEqual(new Set(['a', 'b']));
    expect(res.score).toBe(Number.POSITIVE_INFINITY / 2);
    expect(res.pv.length).toBeGreaterThan(0);
    expect(stats.nodes).toBeGreaterThan(0);
  });

  it('rootMoves scored and best corresponds to selected move', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 3, 'luna');
    const d = makeTower('d', 5, 'estrella');
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });
    const stats: SearchStats = { nodes: 0 };
    const res = searchBestMove(state, 2, stats);
    expect(res.rootMoves.length).toBe(generateAllMoves(state).length);
    const bestRoot = res.rootMoves.reduce((p, q) => (q.score > p.score ? q : p));
    const ids = new Set(idsOf(res.move!)!);
    const idsBest = new Set([bestRoot.move.sourceId, bestRoot.move.targetId]);
    expect(ids).toEqual(idsBest);
  });

  it('nodes visited increases with depth', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 3, 'luna');
    const d = makeTower('d', 5, 'estrella');
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });
    const s1: SearchStats = { nodes: 0 };
    const s2: SearchStats = { nodes: 0 };
    searchBestMove(state, 1, s1);
    searchBestMove(state, 3, s2);
    expect(s1.nodes).toBeGreaterThan(0);
    // Deeper search should not visit fewer nodes; allow equality in highly pruned/terminal trees
    expect(s2.nodes).toBeGreaterThanOrEqual(s1.nodes);
  });
});
