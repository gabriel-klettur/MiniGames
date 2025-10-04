/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { bestMove as indexBestMove } from '../src/ia';
import { bestMove as searchBestMove } from '../src/ia/search';
import { generateAllMoves } from '../src/ia/moves';
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

describe('ia/index.bestMove (wrapper with metrics)', () => {
  it('returns metrics and null move on positions with no legal merges', () => {
    const towers: Tower[] = [
      makeTower('a', 1, 'sol'),
      makeTower('b', 2, 'luna'),
    ];
    const state = baseState({ towers, currentPlayer: 1 });
    const res = indexBestMove(state, 2);
    expect(res.move).toBeNull();
    expect(res.pv.length).toBe(0);
    expect(res.rootMoves.length).toBe(0);
    expect(typeof res.nodes).toBe('number');
    expect(typeof res.elapsedMs).toBe('number');
    expect(typeof res.nps).toBe('number');
    expect(res.nodes).toBeGreaterThanOrEqual(0);
    expect(res.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(res.nps)).toBe(true);
  });

  it('returns a winning move with +Infinity/2 score when an immediate win exists', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 3, 'luna');
    const d = makeTower('d', 5, 'estrella');
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });
    const res = indexBestMove(state, 1);
    expect(res.move).not.toBeNull();
    expect(res.score).toBe(Number.POSITIVE_INFINITY / 2);
    expect(res.pv.length).toBeGreaterThan(0);
    expect(res.nodes).toBeGreaterThan(0);
    expect(res.nps).toBeGreaterThanOrEqual(0);
  });

  it('pv[0] matches the chosen best move', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 1, 'luna');
    const d = makeTower('d', 1, 'luna');
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });
    const res = indexBestMove(state, 2);
    expect(res.move).not.toBeNull();
    expect(res.pv.length).toBeGreaterThan(0);
    const m0 = res.move!;
    const p0 = res.pv[0];
    expect(new Set([m0.sourceId, m0.targetId])).toEqual(new Set([p0.sourceId, p0.targetId]));
  });

  it('nodes should be consistent with search.bestMove depth exploration (non-zero when moves exist)', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 3, 'luna');
    const d = makeTower('d', 5, 'estrella');
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });

    const resIdx = indexBestMove(state, 2);
    expect(resIdx.nodes).toBeGreaterThan(0);

    // Sanity: same root move count as generated moves
    const all = generateAllMoves(state);
    // index.bestMove doesn't expose rootMoves, but search.bestMove does
    const resSearch = searchBestMove(state, 2, { nodes: 0 });
    expect(resSearch.rootMoves.length).toBe(all.length);
  });

  it('metrics: nps is non-negative and finite when elapsedMs > 0', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 3, 'luna');
    const d = makeTower('d', 5, 'estrella');
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });
    const res = indexBestMove(state, 3);
    // Allow very small elapsed times; just ensure the math produced a sane number
    expect(res.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(res.nps)).toBe(true);
    expect(res.nps).toBeGreaterThanOrEqual(0);
  });
});
