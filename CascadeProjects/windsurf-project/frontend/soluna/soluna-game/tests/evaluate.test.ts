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

describe('evaluate()', () => {
  it('returns +Infinity when roundOver and lastMover === me', () => {
    const state = baseState({ roundOver: true, lastMover: 1 });
    const score = evaluate(state, 1);
    expect(score).toBe(Number.POSITIVE_INFINITY / 2);
  });

  it('returns -Infinity when roundOver and lastMover !== me', () => {
    const state = baseState({ roundOver: true, lastMover: 2 });
    const score = evaluate(state, 1);
    expect(score).toBe(Number.NEGATIVE_INFINITY / 2);
  });

  it('terminal: -Infinity if no moves and currentPlayer === me', () => {
    // Two towers with different height and different top => no merges available
    const towers: Tower[] = [
      makeTower('a', 1, 'sol'),
      makeTower('b', 2, 'luna'),
    ];
    const state = baseState({ towers, currentPlayer: 1 });
    const score = evaluate(state, 1);
    expect(score).toBe(Number.NEGATIVE_INFINITY / 2);
  });

  it('terminal: +Infinity if no moves and currentPlayer !== me', () => {
    const towers: Tower[] = [
      makeTower('a', 1, 'sol'),
      makeTower('b', 2, 'luna'),
    ];
    const state = baseState({ towers, currentPlayer: 2 });
    const score = evaluate(state, 1);
    expect(score).toBe(Number.POSITIVE_INFINITY / 2);
  });

  it('non-terminal: returns pairs (positive) if currentPlayer === me', () => {
    // A and B mergeable (same top), C not mergeable with A/B => pairs = 1
    const towers: Tower[] = [
      makeTower('a', 1, 'sol'),
      makeTower('b', 1, 'sol'),
      makeTower('c', 2, 'luna'),
    ];
    const state = baseState({ towers, currentPlayer: 1 });
    const score = evaluate(state, 1);
    expect(score).toBe(1);
  });

  it('non-terminal: returns -pairs if currentPlayer !== me', () => {
    const towers: Tower[] = [
      makeTower('a', 1, 'sol'),
      makeTower('b', 1, 'sol'),
      makeTower('c', 2, 'luna'),
    ];
    const state = baseState({ towers, currentPlayer: 2 });
    const score = evaluate(state, 1);
    expect(score).toBe(-1);
  });
});
