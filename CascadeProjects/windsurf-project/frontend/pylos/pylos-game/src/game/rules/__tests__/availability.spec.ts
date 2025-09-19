import { describe, it, expect } from 'vitest';
import { Board } from '../../board';
import { hasAnyAction } from '../availability';

describe('rules/availability', () => {
  it('returns true when there is reserve and at least one valid placement', () => {
    const b = new Board();
    // Fresh board: there are valid moves at layer 0
    expect(hasAnyAction(b, 1, 15)).toBe(true);
  });

  it('returns false when no reserve and no climbs possible', () => {
    const b = new Board();
    // Fill entire layer 0 with player 1 and 2 alternating so there are no free marbles to climb and no placement from reserve
    let p: 1 | 2 = 1;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        b.place(p, { layer: 0, x, y });
        p = p === 1 ? 2 : 1;
      }
    }
    // With no reserve and no climbs upward (upper layers unsupported), should be false
    expect(hasAnyAction(b, 1, 0)).toBe(false);
  });
});
