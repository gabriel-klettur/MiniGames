import { describe, it, expect } from 'vitest';
import { evaluate } from './evaluate';
import { initialState, isGameOver } from '../game/rules';
import { createEmptyBoard, setCell } from '../game/board';
import type { Position } from '../game/types';

const p = (level: number, row: number, col: number): Position => ({ level, row, col });

describe('ia/evaluate.ts', () => {
  it('returns +/-Infinity/2 for terminal states (win/loss for me)', () => {
    // Win for L: top occupied by L
    let s = initialState();
    let b = createEmptyBoard();
    // Fill supports up to top
    for (let r=0; r<4; r++) for (let c=0; c<4; c++) b = setCell(b, p(0,r,c), 'L');
    for (let r=0; r<3; r++) for (let c=0; c<3; c++) b = setCell(b, p(1,r,c), 'L');
    for (let r=0; r<2; r++) for (let c=0; c<2; c++) b = setCell(b, p(2,r,c), 'L');
    b = setCell(b, p(3,0,0), 'L');
    s = { ...s, board: b };
    expect(isGameOver(s).over).toBe(true);
    expect(evaluate(s, 'L')).toBeGreaterThan(1e100); // +Infinity/2 serialized becomes very large
    expect(evaluate(s, 'D')).toBeLessThan(-1e100);
  });

  it('material affects score: more reserves for me -> higher score', () => {
    const s1 = initialState();
    const s2 = { ...s1, reserves: { L: s1.reserves.L + 1, D: s1.reserves.D - 1 } } as any;
    const e1 = evaluate(s1, 'L');
    const e2 = evaluate(s2, 'L');
    expect(e2).toBeGreaterThan(e1);
  });

  it('height/center preference: higher/centered pieces increase score for owner', () => {
    let s = initialState();
    let b = createEmptyBoard();
    // Place L at higher level vs D at base
    b = setCell(b, p(2,0,0), 'L');
    b = setCell(b, p(0,0,0), 'D');
    s = { ...s, board: b };
    const e = evaluate(s, 'L');
    expect(e).toBeGreaterThan(0);
  });

  it('free pieces advantage: having more free than opponent helps', () => {
    let s = initialState();
    let b = createEmptyBoard();
    // Put two L free pieces, no D pieces
    b = setCell(b, p(0,0,0), 'L');
    b = setCell(b, p(0,3,3), 'L');
    s = { ...s, board: b };
    const e = evaluate(s, 'L');
    expect(e).toBeGreaterThan(0);
  });
});
