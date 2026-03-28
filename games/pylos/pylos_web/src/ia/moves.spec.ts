import { describe, it, expect } from 'vitest';
import { generateBaseMoves, expandWithRecover, applyMove, generateAllMoves, type AIMove } from './moves';
import { initialState } from '../game/rules';
import { createEmptyBoard, setCell } from '../game/board';
import type { Position } from '../game/types';

const p = (level: number, row: number, col: number): Position => ({ level, row, col });

describe('ia/moves.ts', () => {
  it('generateBaseMoves includes placements when reserves available', () => {
    const s = initialState();
    const moves = generateBaseMoves(s);
    const hasPlace = moves.some((m) => m.kind === 'place');
    expect(hasPlace).toBe(true);
  });

  it('generateBaseMoves includes lifts for free pieces with valid upward dests', () => {
    let s = initialState();
    // Build a board with entire base and level 1 filled with L so that
    // some level-1 pieces can lift to level-2 cells whose 2x2 support
    // does not include the chosen source.
    let b = createEmptyBoard();
    // Fill base 4x4
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        b = setCell(b, p(0, r, c), 'L');
      }
    }
    // Fill level 1 (3x3)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        b = setCell(b, p(1, r, c), 'L');
      }
    }
    s = { ...s, board: b };
    const moves = generateBaseMoves(s);
    const hasLift = moves.some((m) => m.kind === 'lift');
    expect(hasLift).toBe(true);
  });

  it('expandWithRecover returns expansions when a scoring move happens (2x2 square)', () => {
    // Prepare near-square for L, place to complete and expect recover expansions
    let s = initialState();
    s.currentPlayer = 'L';
    s.reserves = { L: 3, D: 15 } as any;
    let b = createEmptyBoard();
    b = setCell(b, p(0,0,0), 'L');
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,1,0), 'L');
    s = { ...s, board: b };
    const base: AIMove = { kind: 'place', dest: p(0,1,1) };
    const exps = expandWithRecover(s, base);
    expect(exps.length).toBeGreaterThan(0);
    // Each expansion should carry 1 or 2 recovers
    for (const e of exps) {
      expect(e.kind).toBe('place');
      expect((e.recovers?.length ?? 0)).toBeGreaterThanOrEqual(1);
      expect((e.recovers?.length ?? 0)).toBeLessThanOrEqual(2);
    }
  });

  it('expandWithRecover returns base when no scoring occurs', () => {
    const s = initialState(); // empty board
    const base: AIMove = { kind: 'place', dest: p(0,0,0) };
    const exps = expandWithRecover(s, base);
    expect(exps.length).toBe(1);
    expect(exps[0].recovers).toBeUndefined();
  });

  it('applyMove updates board, reserves, and resets phase/selection', () => {
    let s = initialState();
    s.currentPlayer = 'L';
    const mv: AIMove = { kind: 'place', dest: p(0,0,0) };
    const n = applyMove(s, mv);
    expect(n.board[0][0][0]).toBe('L');
    expect(n.reserves.L).toBe(s.reserves.L - 1);
    expect(n.phase).toBe('play');
    expect(n.selectedSource).toBeUndefined();
    // currentPlayer should switch
    expect(n.currentPlayer).toBe('D');
  });

  it('applyMove honors recovers by removing pieces and giving them back to reserves', () => {
    // Build a board with a free L at (0,0,0)
    let s = initialState();
    s.currentPlayer = 'L';
    let b = createEmptyBoard();
    b = setCell(b, p(0,0,0), 'L');
    s = { ...s, board: b };
    const mv: AIMove = { kind: 'place', dest: p(0,0,1), recovers: [p(0,0,0)] };
    const n = applyMove(s, mv);
    expect(n.board[0][0][0]).toBeNull();
    expect(n.reserves.L).toBe(s.reserves.L); // -1 for place, +1 for recover => net 0
  });

  it('generateAllMoves expands scoring base moves with recovers', () => {
    // Same near-square scenario
    let s = initialState();
    s.currentPlayer = 'L';
    s.reserves = { L: 3, D: 15 } as any;
    let b = createEmptyBoard();
    b = setCell(b, p(0,0,0), 'L');
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,1,0), 'L');
    s = { ...s, board: b };
    const all = generateAllMoves(s);
    const anyScoring = all.some((m) => m.kind === 'place' && m.dest.level === 0 && m.dest.row === 1 && m.dest.col === 1 && (m.recovers?.length ?? 0) >= 1);
    expect(anyScoring).toBe(true);
  });
});
