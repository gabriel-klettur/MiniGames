import { describe, it, expect } from 'vitest';
import { createEmptyBoard, levelSize, LEVELS, inBounds, positions, getCell, setCell, isEmpty, isSupported, canPlaceAt, isSupportingAny, isFree, posKey, cloneBoard } from './board';
import type { Position } from './types';

describe('board.ts utilities', () => {
  it('createEmptyBoard builds 4 levels sized 4x4,3x3,2x2,1x1 with nulls', () => {
    const b = createEmptyBoard();
    expect(b.length).toBe(LEVELS);
    for (let l = 0; l < LEVELS; l++) {
      const size = levelSize(l);
      expect(b[l].length).toBe(size);
      for (let r = 0; r < size; r++) {
        expect(b[l][r].length).toBe(size);
        for (let c = 0; c < size; c++) {
          expect(b[l][r][c]).toBeNull();
        }
      }
    }
  });

  it('inBounds works and positions() enumerates all cells', () => {
    const all = positions();
    const counts = [16, 9, 4, 1];
    expect(all.length).toBe(counts.reduce((a, b) => a + b, 0));
    for (const p of all) expect(inBounds(p)).toBe(true);
    expect(inBounds({ level: -1, row: 0, col: 0 })).toBe(false);
    expect(inBounds({ level: 4, row: 0, col: 0 })).toBe(false);
    expect(inBounds({ level: 0, row: 4, col: 0 })).toBe(false);
    expect(inBounds({ level: 1, row: 3, col: 0 })).toBe(false);
  });

  it('getCell/setCell are pure (do not mutate original)', () => {
    const b0 = createEmptyBoard();
    const p: Position = { level: 0, row: 0, col: 0 };
    const b1 = setCell(b0, p, 'L');
    expect(getCell(b0, p)).toBeNull();
    expect(getCell(b1, p)).toBe('L');
  });

  it('cloneBoard deeply clones', () => {
    const b0 = createEmptyBoard();
    const p: Position = { level: 0, row: 1, col: 2 };
    const b1 = setCell(b0, p, 'D');
    const b2 = cloneBoard(b1);
    const b3 = setCell(b2, { level: 0, row: 0, col: 0 }, 'L');
    expect(getCell(b1, { level: 0, row: 0, col: 0 })).toBeNull();
    expect(getCell(b3, { level: 0, row: 0, col: 0 })).toBe('L');
    expect(getCell(b1, p)).toBe('D');
  });

  it('isEmpty / canPlaceAt / isSupported basics', () => {
    let b = createEmptyBoard();
    const p00: Position = { level: 0, row: 0, col: 0 };
    expect(isEmpty(b, p00)).toBe(true);
    expect(isSupported(b, p00)).toBe(true); // base level always supported
    expect(canPlaceAt(b, p00)).toBe(true);

    // Level 1 initially not supported
    const q: Position = { level: 1, row: 0, col: 0 };
    expect(isSupported(b, q)).toBe(false);
    expect(canPlaceAt(b, q)).toBe(false);

    // Fill 2x2 below then q becomes supported
    b = setCell(b, { level: 0, row: 0, col: 0 }, 'L');
    b = setCell(b, { level: 0, row: 1, col: 0 }, 'D');
    b = setCell(b, { level: 0, row: 0, col: 1 }, 'L');
    b = setCell(b, { level: 0, row: 1, col: 1 }, 'D');
    expect(isSupported(b, q)).toBe(true);
    expect(canPlaceAt(b, q)).toBe(true);
  });

  it('isSupportingAny and isFree switch when placing an above piece', () => {
    let b = createEmptyBoard();
    // Prepare 2x2 base support
    const sup = [
      { level: 0, row: 0, col: 0 },
      { level: 0, row: 1, col: 0 },
      { level: 0, row: 0, col: 1 },
      { level: 0, row: 1, col: 1 },
    ] as Position[];
    for (const s of sup) b = setCell(b, s, 'L');
    const above: Position = { level: 1, row: 0, col: 0 };

    // Before placing above, none of the supports should be supporting any piece
    for (const s of sup) {
      expect(isSupportingAny(b, s)).toBe(false);
      expect(isFree(b, s)).toBe(true);
    }

    // Place a piece above, now supports become "supporting"
    b = setCell(b, above, 'L');
    for (const s of sup) {
      expect(isSupportingAny(b, s)).toBe(true);
      expect(isFree(b, s)).toBe(false);
    }
  });

  it('posKey formats as level-row-col', () => {
    expect(posKey({ level: 2, row: 1, col: 0 })).toBe('2-1-0');
  });
});
