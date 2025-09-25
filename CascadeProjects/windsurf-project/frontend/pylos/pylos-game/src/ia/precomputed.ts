import type { Position } from '../game/types';
import { levelSize } from '../game/board';

/**
 * Precomputed windows for threat detection (squares and lines).
 * Built lazily on first access to avoid startup cost.
 */

type Window = Position[]; // array of positions forming a pattern

const SQUARE_WINDOWS: Array<Window[]> = [[], [], [], []]; // levels 0..3
const LINE_WINDOWS: Array<Window[]> = [[], [], [], []];   // levels 0..3
let initialized = false;

function makePos(level: number, row: number, col: number): Position {
  return { level: level as 0 | 1 | 2 | 3, row, col } as Position;
}

function init(): void {
  if (initialized) return;
  initialized = true;
  // Squares exist on levels 0..2
  for (let level = 0; level <= 2; level++) {
    const size = levelSize(level);
    const windows: Window[] = [];
    for (let r = 0; r + 1 < size; r++) {
      for (let c = 0; c + 1 < size; c++) {
        windows.push([
          makePos(level, r, c),
          makePos(level, r + 1, c),
          makePos(level, r, c + 1),
          makePos(level, r + 1, c + 1),
        ]);
      }
    }
    SQUARE_WINDOWS[level] = windows;
  }

  // Lines: level 0 (len 4), level 1 (len 3)
  for (let level = 0; level <= 1; level++) {
    const size = levelSize(level);
    const req = level === 0 ? 4 : 3;
    const windows: Window[] = [];
    // Rows
    for (let row = 0; row < size; row++) {
      for (let start = 0; start + req - 1 < size; start++) {
        const w: Window = [];
        for (let k = 0; k < req; k++) w.push(makePos(level, row, start + k));
        windows.push(w);
      }
    }
    // Cols
    for (let col = 0; col < size; col++) {
      for (let start = 0; start + req - 1 < size; start++) {
        const w: Window = [];
        for (let k = 0; k < req; k++) w.push(makePos(level, start + k, col));
        windows.push(w);
      }
    }
    LINE_WINDOWS[level] = windows;
  }
}

export function getSquareWindows(level: 0 | 1 | 2 | 3): Window[] {
  init();
  return SQUARE_WINDOWS[level] || [];
}

export function getLineWindows(level: 0 | 1 | 2 | 3): Window[] {
  init();
  return LINE_WINDOWS[level] || [];
}
