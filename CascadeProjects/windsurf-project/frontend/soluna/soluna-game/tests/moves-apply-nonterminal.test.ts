/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { applyMove, type AIMove } from '../src/ia/moves';
import type { GameState, Tower } from '../src/game/types';
import { anyValidMoves } from '../src/game/rules';

function makeTower(id: string, height: number, top: Tower['top'], x = 0.5, y = 0.5): Tower {
  const stack = Array.from({ length: height }, () => top);
  return { id, stack, height, top, pos: { x, y } };
}

function baseState(partial?: Partial<GameState>): GameState {
  const defaults: GameState = {
    towers: [],
    selectedId: 'sel',
    currentPlayer: 1,
    lastMover: null,
    roundOver: false,
    gameOver: false,
    players: { 1: { stars: 0 }, 2: { stars: 0 } },
    mergeFx: null,
  };
  return { ...defaults, ...(partial || {}) } as GameState;
}

describe('applyMove() non-terminal', () => {
  it('advances currentPlayer, clears selection, does not end round', () => {
    // Construct a position where after a merge, opponent still has moves
    // Setup: a(1 sol), b(1 sol) -> merge; keep c(1 luna), d(1 luna) so opponent has a merge
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 1, 'luna');
    const d = makeTower('d', 1, 'luna');

    const state = baseState({ towers: [a, b, c, d], currentPlayer: 1 });
    expect(anyValidMoves(state.towers)).toBe(true);

    const mv: AIMove = { kind: 'merge', sourceId: a.id, targetId: b.id };
    const next = applyMove(state, mv);

    expect(next.roundOver).toBe(false);
    expect(next.currentPlayer).toBe(2);
    expect(next.selectedId).toBeNull();
    expect(anyValidMoves(next.towers)).toBe(true);
  });
});
