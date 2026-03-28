/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { bestMove as searchBestMove } from '../src/ia/search';
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

describe('orderMoves heuristic via rootMoves order', () => {
  it('prioritizes merges with higher combined height, and prefers lower source height on ties', () => {
    // Towers: a(3 sol), b(2 luna), c(1 sol), d(1 luna)
    // Mergeable pairs:
    //  - a<->c (same symbol), combined height = 4 (should come first)
    //  - c<->d (same height=1), combined height = 2 (should come after a<->c)
    const a = makeTower('a', 3, 'sol');
    const b = makeTower('b', 2, 'luna');
    const c = makeTower('c', 1, 'sol');
    const d = makeTower('d', 1, 'luna');
    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });

    const res = searchBestMove(state, 1, { nodes: 0 });

    // rootMoves are evaluated in the order given by orderMoves()
    // First two should be merges between a and c (combined height 4)
    const topPairs = res.rootMoves.slice(0, 2).map(r => new Set([r.move.sourceId, r.move.targetId]));
    expect(topPairs[0]).toEqual(new Set(['a', 'c']));
    expect(topPairs[1]).toEqual(new Set(['a', 'c']));

    // Tie-breaker: for the a<->c pair, prefer source with lower height first => c -> a first
    const first = res.rootMoves[0].move;
    expect(first.sourceId).toBe('c');
    expect(first.targetId).toBe('a');

    // Next moves should include c<->d (combined height 2)
    const nextPairs = res.rootMoves.slice(2).map(r => new Set([r.move.sourceId, r.move.targetId]));
    const hasCD = nextPairs.some(s => s.size === 2 && s.has('c') && s.has('d'));
    expect(hasCD).toBe(true);
  });
});
