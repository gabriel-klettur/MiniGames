import { describe, it, expect } from 'vitest';
import { initialState, placeFromReserve, isGameOver, recoverPiece, finishRecovery } from './rules';
import { createEmptyBoard, setCell } from './board';
import type { GameState, Position } from './types';

// Helper positions for a base-level 2x2 square
const p00: Position = { level: 0, row: 0, col: 0 };
const p01: Position = { level: 0, row: 0, col: 1 };
const p10: Position = { level: 0, row: 1, col: 0 };
const p11: Position = { level: 0, row: 1, col: 1 };

/**
 * This scenario reproduces the client complaint:
 * "When I am left with the last ball and I form a combo, I must recover, but the app makes me lose."
 *
 * Expected: When placing the last reserve ball completes a scoring pattern, the state must enter
 * the 'recover' phase and the game must NOT be over at that moment.
 */
describe('Edge case: last reserve placement that scores should start recovery, not game over', () => {
  it('enters recovery phase and does not declare game over', () => {
    // Arrange: current player L has a near-square and only 1 reserve piece left
    let state: GameState = initialState();
    state.currentPlayer = 'L';
    state = { ...state, reserves: { L: 1, D: 15 } };

    // Build board with three L pieces forming an almost-complete 2x2 at base level
    let board = createEmptyBoard();
    board = setCell(board, p00, 'L');
    board = setCell(board, p01, 'L');
    board = setCell(board, p10, 'L');
    state = { ...state, board };

    // Act: place last reserve at p11 to complete the square
    const res = placeFromReserve(state, p11);

    // Assert base expectations
    expect(res.error).toBeUndefined();
    const next = res.state;
    expect(next.reserves.L).toBe(0); // last reserve used

    // Scoring must trigger recovery phase
    expect(next.phase).toBe('recover');
    expect(next.recovery).toBeDefined();
    expect(next.recovery?.player).toBe('L');
    expect(next.recovery?.removedSoFar).toBe(0);
    expect(next.recovery?.remaining).toBeGreaterThanOrEqual(1); // at least one free to recover

    // Game must NOT be over during recovery
    const over = isGameOver(next);
    expect(over.over).toBe(false);
  });

  it('allows recovering at least one piece and then finishing recovery to pass the turn', () => {
    // Arrange similar to previous test
    let state: GameState = initialState();
    state.currentPlayer = 'L';
    state = { ...state, reserves: { L: 1, D: 15 } };
    let board = createEmptyBoard();
    board = setCell(board, p00, 'L');
    board = setCell(board, p01, 'L');
    board = setCell(board, p10, 'L');
    state = { ...state, board };

    // Place last reserve to complete square
    const placed = placeFromReserve(state, p11);
    const afterPlace = placed.state;
    expect(afterPlace.phase).toBe('recover');

    // Choose one free piece to recover (e.g., p00)
    const rec1 = recoverPiece(afterPlace, p00);
    expect(rec1.error).toBeUndefined();
    expect(rec1.state.reserves.L).toBe(1); // +1 returned to reserve

    // Finish recovery (minRequired is 1, so allowed after one removal)
    const fin = finishRecovery(rec1.state);
    expect(fin.error).toBeUndefined();
    expect(fin.state.phase).toBe('play');
    expect(fin.state.currentPlayer).toBe('D'); // turn passes
  });
});
