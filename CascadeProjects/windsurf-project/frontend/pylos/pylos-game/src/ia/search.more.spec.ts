import { describe, it, expect } from 'vitest';
import { bestMove } from './search';
import { initialState } from '../game/rules';

describe('ia/search.ts – early cutoff', () => {
  it('respects shouldStop() at root and returns first move evaluation', () => {
    const s = initialState();
    const res = bestMove(s, 4, undefined, { shouldStop: () => true });
    expect(res.move).not.toBeNull();
    expect(Array.isArray(res.rootMoves)).toBe(true);
    expect(res.rootMoves.length).toBeGreaterThan(0);
    // pv should start with the chosen move
    expect(res.pv.length).toBeGreaterThan(0);
  });
});
