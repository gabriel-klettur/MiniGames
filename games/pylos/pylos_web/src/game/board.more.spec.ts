import { describe, it, expect } from 'vitest';
import { createEmptyBoard, setCell, countPieces } from './board';
import type { Position } from './types';

const p = (level: number, row: number, col: number): Position => ({ level, row, col });

describe('board.ts – extra coverage', () => {
  it('countPieces counts the number of pieces for each player', () => {
    let b = createEmptyBoard();
    b = setCell(b, p(0,0,0), 'L');
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,1,0), 'D');
    b = setCell(b, p(1,0,0), 'D');
    expect(countPieces(b, 'L')).toBe(2);
    expect(countPieces(b, 'D')).toBe(2);
  });
});
