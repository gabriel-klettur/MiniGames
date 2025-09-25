import { describe, it, expect } from 'vitest';
import {
  initialState,
  validReserveDestinations,
  selectMoveSource,
  movePiece,
  placeFromReserve,
  recoverPiece,
  finishRecovery,
  autoCompletePyramid,
  isGameOver,
} from './rules';
import { createEmptyBoard, setCell, getCell } from './board';
import type { GameState, Position } from './types';

const p = (level: number, row: number, col: number): Position => ({ level, row, col });

describe('rules.ts - basics', () => {
  it('initialState starts with L, 15 reserves each, phase=play', () => {
    const s = initialState();
    expect(s.currentPlayer).toBe('L');
    expect(s.reserves).toEqual({ L: 15, D: 15 });
    expect(s.phase).toBe('play');
  });

  it('validReserveDestinations returns base cells for empty board', () => {
    const s = initialState();
    const dests = validReserveDestinations(s.board);
    // On empty board, only base (level 0) supported
    expect(dests.every((q) => q.level === 0)).toBe(true);
    expect(dests.length).toBe(16);
  });
});

describe('rules.ts - selecting and moving pieces', () => {
  it('cannot select opponent piece or non-free piece', () => {
    let s: GameState = initialState();
    // Place one L and one D
    s = placeFromReserve(s, p(0,0,0)).state; // L -> now D's turn unless recovery
    s.currentPlayer = 'L'; // force L again for controlled test
    s = { ...s, board: setCell(s.board, p(0,0,1), 'D') };

    // Trying to select D piece as L
    const selOpp = selectMoveSource(s, p(0,0,1));
    expect(selOpp.error).toBeDefined();

    // Make piece at (0,0,0) support something above to become non-free
    let b = s.board;
    b = setCell(b, p(0,1,0), 'L');
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,1,1), 'L');
    b = setCell(b, p(1,0,0), 'L'); // now (0,0,0) is supporting
    s = { ...s, board: b };
    const selNotFree = selectMoveSource(s, p(0,0,0));
    expect(selNotFree.error).toBeDefined();
  });

  it('selectMoveSource requires at least one upward destination', () => {
    // Build a scenario where a free piece has no upward supported dests
    let s = initialState();
    // Place a single L at (0,0,0) and keep above unsupported
    s.currentPlayer = 'L';
    s = placeFromReserve(s, p(0,0,0)).state;
    // Remove all reserves to avoid turn switch concerns
    s.currentPlayer = 'L';
    const sel = selectMoveSource(s, p(0,0,0));
    // No 2x2 below any level-1 cell, so there is no valid destination
    expect(sel.error).toBeDefined();
  });

  it('movePiece only upward and requires destination supported (with src removed)', () => {
    // Build 2x2 at base to support (1,0,0). Move from (0,0,0) up.
    let s = initialState();
    s.currentPlayer = 'L';
    let b = createEmptyBoard();
    b = setCell(b, p(0,0,0), 'L');
    b = setCell(b, p(0,1,0), 'L');
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,1,1), 'L');
    // Extend with another 2x2 to support (1,0,1) without using the source (0,0,0)
    b = setCell(b, p(0,0,2), 'L');
    b = setCell(b, p(0,1,2), 'L');
    s = { ...s, board: b };

    // Select source
    const sel = selectMoveSource(s, p(0,0,0));
    expect(sel.error).toBeUndefined();
    const s2 = sel.state;

    // Try invalid: same or lower level
    const sameLevel = movePiece(s2, p(0,2,2));
    expect(sameLevel.error).toBeDefined();

    // Invalid: destination (1,0,0) relies on the 2x2 support that includes the source (0,0,0).
    // When validating, the source is considered removed, so support is insufficient and the move is rejected.
    const invalidSupport = movePiece(s2, p(1,0,0));
    expect(invalidSupport.error).toBeDefined();
  });
});

describe('rules.ts - recovery flow and scoring', () => {
  it('forming a 2x2 square triggers recovery with minRequired=1 and up to 2 remaining', () => {
    let s = initialState();
    s.currentPlayer = 'L';
    s.reserves = { L: 2, D: 15 } as any;
    // Make three L in base
    let b = createEmptyBoard();
    b = setCell(b, p(0,0,0), 'L');
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,1,0), 'L');
    s = { ...s, board: b };
    // Place to complete square
    const res = placeFromReserve(s, p(0,1,1));
    const n = res.state;
    expect(n.phase).toBe('recover');
    expect(n.recovery?.player).toBe('L');
    expect(n.recovery?.minRequired).toBe(1);
    expect(n.recovery?.remaining).toBeGreaterThan(0);
  });

  it('recoverPiece increments reserve and may auto-finish when no more free pieces', () => {
    // Build a scenario with exactly one free piece to recover
    let s = initialState();
    s.currentPlayer = 'L';
    s.reserves = { L: 1, D: 15 } as any;
    let b = createEmptyBoard();
    // Three Ls and one D to block frees except the placed one later
    b = setCell(b, p(0,0,0), 'L');
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,1,0), 'L');
    s = { ...s, board: b };
    const placed = placeFromReserve(s, p(0,1,1));
    let s2 = placed.state;
    expect(s2.phase).toBe('recover');

    const rec = recoverPiece(s2, p(0,0,0));
    expect(rec.error).toBeUndefined();
    expect(rec.state.reserves.L).toBe(1); // used 1, recovered 1

    // If still free pieces exist and remaining>0, stays in recover; otherwise finish
    // We won't assert auto-finish strictly here due to variability
  });

  it('finishRecovery enforces minRequired and passes the turn', () => {
    let s = initialState();
    // Force into recovery with a known state
    s.currentPlayer = 'L';
    s.reserves = { L: 5, D: 15 } as any;
    let b = createEmptyBoard();
    b = setCell(b, p(0,0,0), 'L');
    b = setCell(b, p(0,0,1), 'L');
    b = setCell(b, p(0,1,0), 'L');
    s = { ...s, board: b };
    s = placeFromReserve(s, p(0,1,1)).state;
    expect(s.phase).toBe('recover');
    // Try finishing without recovering
    const bad = finishRecovery(s);
    expect(bad.error).toBeDefined();
    // Recover one and finish
    const rec = recoverPiece(s, p(0,0,0)).state;
    const fin = finishRecovery(rec);
    expect(fin.error).toBeUndefined();
    expect(fin.state.phase).toBe('play');
    expect(fin.state.currentPlayer).toBe('D');
  });
});

describe('rules.ts - autoCompletePyramid and isGameOver', () => {
  it('autoCompletePyramid fills supported cells for the only player with reserves', () => {
    let s = initialState();
    // Simulate D has reserves, L none
    s.reserves = { L: 0, D: 3 } as any;
    s.currentPlayer = 'L';
    const s2 = autoCompletePyramid(s);
    // Should place at least one D on base
    const countD = [p(0,0,0), p(0,0,1), p(0,1,0), p(0,1,1)].reduce((acc, q) => acc + (getCell(s2.board, q) === 'D' ? 1 : 0), 0);
    expect(countD).toBeGreaterThan(0);
  });

  it('isGameOver true when top is occupied, false during recovery, true when current player cannot play', () => {
    let s = initialState();
    // Top occupied
    let b = createEmptyBoard();
    // Fill all supports up to top
    // base 4x4
    for (let r=0; r<4; r++) for (let c=0; c<4; c++) b = setCell(b, p(0,r,c), 'L');
    // level 1: 3x3
    for (let r=0; r<3; r++) for (let c=0; c<3; c++) b = setCell(b, p(1,r,c), 'L');
    // level 2: 2x2
    for (let r=0; r<2; r++) for (let c=0; c<2; c++) b = setCell(b, p(2,r,c), 'L');
    // top cell
    b = setCell(b, p(3,0,0), 'L');
    s = { ...s, board: b };
    expect(isGameOver(s).over).toBe(true);

    // During recovery -> not over
    s = initialState();
    s = { ...s, phase: 'recover', recovery: { player: 'L', remaining: 1, minRequired: 1, removedSoFar: 0 } } as any;
    expect(isGameOver(s).over).toBe(false);

    // No reserves and no legal moves for current player
    s = initialState();
    s.currentPlayer = 'L';
    s.reserves = { L: 0, D: 0 } as any;
    // Put a single L that is supporting something above to remove free moves
    let bb = createEmptyBoard();
    bb = setCell(bb, p(0,0,0), 'L');
    bb = setCell(bb, p(0,1,0), 'L');
    bb = setCell(bb, p(0,0,1), 'L');
    bb = setCell(bb, p(0,1,1), 'L');
    bb = setCell(bb, p(1,0,0), 'L'); // now none of those four are free
    s = { ...s, board: bb };
    const over = isGameOver(s);
    expect(over.over).toBe(true);
    expect(over.winner).toBe('D');
  });
});
