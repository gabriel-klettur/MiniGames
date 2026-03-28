/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { generateAllMoves, type AIMove } from '../src/ia/moves';
import { canMerge } from '../src/game/rules';
import type { Tower, GameState } from '../src/game/types';

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

describe('ia/moves.generateAllMoves', () => {
  it('returns an empty list when no pairs are mergeable', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 2, 'luna');
    const state = baseState({ towers: [a, b] });
    const ms = generateAllMoves(state);
    expect(ms.length).toBe(0);
  });

  it('generates directed moves for each mergeable pair (both directions)', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 2, 'luna');
    const state = baseState({ towers: [a, b, c] });
    const ms = generateAllMoves(state);
    // Undirected mergeable pairs: (a,b) only => expect 2 directed moves: a->b and b->a
    const pairs = new Set(ms.map(m => `${m.sourceId}->${m.targetId}`));
    expect(pairs.has('a->b')).toBe(true);
    expect(pairs.has('b->a')).toBe(true);
    expect(ms.length).toBe(2);
  });

  it('counts directed merges: for k undirected pairs it yields 2k moves', () => {
    const a = makeTower('a', 1, 'sol');
    const b = makeTower('b', 1, 'sol');
    const c = makeTower('c', 1, 'luna');
    const d = makeTower('d', 1, 'luna');
    const state = baseState({ towers: [a, b, c, d] });
    const ms = generateAllMoves(state);

    // Compute k = number of undirected mergeable pairs
    const ts = state.towers;
    let k = 0;
    for (let i = 0; i < ts.length; i++) {
      for (let j = i + 1; j < ts.length; j++) {
        if (canMerge(ts[i], ts[j]) || canMerge(ts[j], ts[i])) k++;
      }
    }
    expect(ms.length).toBe(2 * k);
  });
});
