import { describe, it, expect } from 'vitest';
import { Board } from '../../board';
import { squaresCreatedBy, linesCreatedBy } from '../scoring';

describe('rules/scoring', () => {
  it('detects a 2x2 square formed on layer 0', () => {
    const b = new Board();
    // Create a 2x2 square for player 1 at (0,0)-(1,1)
    b.place(1, { layer: 0, x: 0, y: 0 });
    b.place(1, { layer: 0, x: 1, y: 0 });
    b.place(1, { layer: 0, x: 0, y: 1 });
    // The last piece forms the square when placing at (1,1)
    b.place(1, { layer: 0, x: 1, y: 1 });
    const cell = { layer: 0, x: 1, y: 1 };
    expect(squaresCreatedBy(b, 1, cell)).toBe(1);
  });

  it('detects a horizontal line on layer 0', () => {
    const b = new Board();
    // Row y=2 complete for player 2
    b.place(2, { layer: 0, x: 0, y: 2 });
    b.place(2, { layer: 0, x: 1, y: 2 });
    b.place(2, { layer: 0, x: 2, y: 2 });
    b.place(2, { layer: 0, x: 3, y: 2 });
    const cell = { layer: 0, x: 2, y: 2 };
    expect(linesCreatedBy(b, 2, cell)).toBe(1);
  });

  it('detects a vertical line on layer 1 (3-length)', () => {
    const b = new Board();
    // Fill layer 1 column x=1 for player 1: size is 3x3
    b.place(1, { layer: 1, x: 1, y: 0 });
    b.place(1, { layer: 1, x: 1, y: 1 });
    b.place(1, { layer: 1, x: 1, y: 2 });
    const cell = { layer: 1, x: 1, y: 1 };
    expect(linesCreatedBy(b, 1, cell)).toBe(1);
  });
});
