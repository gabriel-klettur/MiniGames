/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import type { GameState, Tower } from '../src/game/types';
import { computeAdaptiveTimeBudget } from '../src/ia/time';

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
  } as any;
  return { ...defaults, ...(partial || {}) } as GameState;
}

describe('ia/time.computeAdaptiveTimeBudget', () => {
  it('returns values within default clamps [minMs, maxMs]', () => {
    const s = baseState({
      towers: [
        makeTower('a', 1, 'sol'),
        makeTower('b', 1, 'sol'),
        makeTower('c', 1, 'luna'),
        makeTower('d', 1, 'luna'),
      ],
    });
    const t = computeAdaptiveTimeBudget(s);
    expect(t).toBeGreaterThanOrEqual(200);
    expect(t).toBeLessThanOrEqual(4000);
  });

  it('is monotonic non-decreasing with root branching factor (within clamp range)', () => {
    // State with fewer merges at root
    const sFew = baseState({
      towers: [
        makeTower('a', 1, 'sol'),
        makeTower('b', 2, 'luna'), // mixed heights/symbols => fewer merges
        makeTower('c', 3, 'estrella'),
        makeTower('d', 4, 'fugaz'),
      ],
    });
    // State with many merges at root (all height 1, many same-symbol pairs)
    const sMany = baseState({
      towers: [
        makeTower('a', 1, 'sol'),
        makeTower('b', 1, 'sol'),
        makeTower('c', 1, 'sol'),
        makeTower('d', 1, 'sol'),
        makeTower('e', 1, 'luna'),
        makeTower('f', 1, 'luna'),
      ],
    });
    const tFew = computeAdaptiveTimeBudget(sFew, { minMs: 100, maxMs: 5000 });
    const tMany = computeAdaptiveTimeBudget(sMany, { minMs: 100, maxMs: 5000 });
    expect(tMany).toBeGreaterThanOrEqual(tFew);
  });
});
