import { describe, it, expect } from 'vitest';
import { computeBestMove, computeBestNextState } from './index';
import { initialState } from '../game/rules';

describe('ia/index.ts public API', () => {
  it('computeBestMove returns a move and numeric score', () => {
    const s = initialState();
    const res = computeBestMove(s, 2);
    expect(res).toBeTruthy();
    expect(['place', 'lift']).toContain((res.move as any)?.kind);
    expect(typeof res.score).toBe('number');
  });

  it('computeBestNextState applies the best move when available', () => {
    const s = initialState();
    const n = computeBestNextState(s, 1);
    // On empty initial board, should place something at base and switch turn
    expect(n.currentPlayer).toBe('D');
  });
});
