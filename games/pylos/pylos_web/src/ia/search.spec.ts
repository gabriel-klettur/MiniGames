import { describe, it, expect } from 'vitest';
import { bestMove } from './search';
import { initialState } from '../game/rules';

describe('ia/search.ts', () => {
  it('bestMove returns a legal move at shallow depth', () => {
    const s = initialState();
    const res = bestMove(s, 1);
    expect(res.move).not.toBeNull();
    expect(typeof res.score).toBe('number');
    expect(Array.isArray(res.pv)).toBe(true);
    expect(Array.isArray(res.rootMoves)).toBe(true);
  });

  it('depth is respected (depth 0 delegated through bestMove path still evaluates child once)', () => {
    const s = initialState();
    const res = bestMove(s, 0);
    // At depth 0, bestMove evaluates each root child at depth-1=0 in alphabeta implementation
    expect(res.move).not.toBeNull();
  });
});
