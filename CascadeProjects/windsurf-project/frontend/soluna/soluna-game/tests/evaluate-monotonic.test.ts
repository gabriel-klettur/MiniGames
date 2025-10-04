/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
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

describe('evaluate() monotonic with number of mergeable pairs', () => {
  it('when currentPlayer === me, more mergeable pairs => higher (or equal) score', () => {
    // Few pairs
    const sFew = baseState({
      currentPlayer: 1,
      towers: [
        makeTower('a', 1, 'sol'),
        makeTower('b', 1, 'sol'), // 1 pair
        makeTower('c', 2, 'luna'),
      ],
    });
    // More pairs (add a second mergeable pair)
    const sMore = baseState({
      currentPlayer: 1,
      towers: [
        makeTower('a', 1, 'sol'),
        makeTower('b', 1, 'sol'), // pair 1
        makeTower('c', 1, 'luna'),
        makeTower('d', 1, 'luna'), // pair 2
      ],
    });
    const eFew = evaluate(sFew, 1);
    const eMore = evaluate(sMore, 1);
    expect(eMore).toBeGreaterThanOrEqual(eFew);
  });

  it('when currentPlayer !== me, more mergeable pairs => lower (or equal) score', () => {
    const sFew = baseState({
      currentPlayer: 2,
      towers: [
        makeTower('a', 1, 'sol'),
        makeTower('b', 1, 'sol'), // 1 pair
        makeTower('c', 2, 'luna'),
      ],
    });
    const sMore = baseState({
      currentPlayer: 2,
      towers: [
        makeTower('a', 1, 'sol'),
        makeTower('b', 1, 'sol'), // pair 1
        makeTower('c', 1, 'luna'),
        makeTower('d', 1, 'luna'), // pair 2
      ],
    });
    const eFew = evaluate(sFew, 1);
    const eMore = evaluate(sMore, 1);
    expect(eMore).toBeLessThanOrEqual(eFew);
  });
});
