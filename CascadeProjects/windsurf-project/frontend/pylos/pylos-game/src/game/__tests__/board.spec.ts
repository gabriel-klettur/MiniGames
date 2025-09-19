import { describe, it, expect } from 'vitest';
import { Board } from '../board';

describe('game/board', () => {
  it('validPlacement: allows on base layer and respects support on upper layers', () => {
    const b = new Board();
    // Base layer (0) should allow empty cells
    expect(b.validPlacement({ layer: 0, x: 0, y: 0 })).toBe(true);
    // Upper layer (1) requires 2x2 support below
    expect(b.validPlacement({ layer: 1, x: 0, y: 0 })).toBe(false);
    // Provide support
    b.place(1, { layer: 0, x: 0, y: 0 });
    b.place(1, { layer: 0, x: 1, y: 0 });
    b.place(1, { layer: 0, x: 0, y: 1 });
    b.place(1, { layer: 0, x: 1, y: 1 });
    expect(b.validPlacement({ layer: 1, x: 0, y: 0 })).toBe(true);
  });

  it('isFree: false when supporting a ball above, true when not', () => {
    const b = new Board();
    // Build support square
    b.place(1, { layer: 0, x: 0, y: 0 });
    b.place(1, { layer: 0, x: 1, y: 0 });
    b.place(1, { layer: 0, x: 0, y: 1 });
    b.place(1, { layer: 0, x: 1, y: 1 });
    // Place on layer 1
    b.place(1, { layer: 1, x: 0, y: 0 });
    // Cells that support above should not be free
    expect(b.isFree({ layer: 0, x: 0, y: 0 })).toBe(false);
    // A different base cell with no above should be free once placed
    b.place(1, { layer: 0, x: 3, y: 3 });
    expect(b.isFree({ layer: 0, x: 3, y: 3 })).toBe(true);
  });

  it('move: only allows moving own free marble upwards to valid destination', () => {
    const b = new Board();
    // Build support for layer 1 at (0,0)
    b.place(1, { layer: 0, x: 0, y: 0 });
    b.place(1, { layer: 0, x: 1, y: 0 });
    b.place(1, { layer: 0, x: 0, y: 1 });
    b.place(1, { layer: 0, x: 1, y: 1 });
    // Another ball for player 1 to climb
    b.place(1, { layer: 0, x: 3, y: 3 });
    // Move upwards to layer 1
    const moved = b.move(1, { layer: 0, x: 3, y: 3 }, { layer: 1, x: 0, y: 0 });
    expect(moved).toBe(true);
    // Cannot move to same or lower layer
    expect(b.move(1, { layer: 1, x: 0, y: 0 }, { layer: 0, x: 2, y: 2 })).toBe(false);
  });
});
