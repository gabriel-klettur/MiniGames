import type { Position } from '../game/types';
import { levelSize } from '../game/board';

/**
 * Precomputed windows for threat detection (squares and lines).
 * Built lazily on first access to avoid startup cost.
 */

type Window = Position[]; // array of positions forming a pattern

const SQUARE_WINDOWS: Array<Window[]> = [[], [], [], []]; // levels 0..3
const LINE_WINDOWS: Array<Window[]> = [[], [], [], []];   // levels 0..3
// Precomputed supports and center weights
// SUPPORTS[level][row][col] -> Position[] of 4 supports (empty on level 0)
const SUPPORTS: Array<Position[][][]> = [[], [], [], []];
// CENTER_W[level][row][col] -> number in [0,1]
const CENTER_W: Array<number[][]> = [[], [], [], []];
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

  // Supports (for levels 1..3) and center weights (for all levels)
  for (let level = 0 as 0 | 1 | 2 | 3; level <= 3; level = (level + 1) as any) {
    const size = levelSize(level);
    // Initialize containers per level
    const supp2D: Position[][][] = new Array(size);
    const center2D: number[][] = new Array(size);
    // Center metric as used in evaluate.ts
    const center = (size - 1) / 2;
    const maxDist = center * 2 || 1;
    for (let r = 0; r < size; r++) {
      supp2D[r] = new Array(size);
      center2D[r] = new Array(size);
      for (let c = 0; c < size; c++) {
        // Precompute center weight in [0,1]
        const dist = Math.abs(r - center) + Math.abs(c - center);
        const centerBonus = 1 - dist / maxDist;
        center2D[r][c] = centerBonus;

        // Precompute supports positions below for placing at (level,r,c)
        if (level === 0) {
          supp2D[r][c] = [];
        } else {
          const l = level - 1;
          // For levels above 0, the 2x2 directly below must exist
          const arr: Position[] = [
            makePos(l, r, c),
            makePos(l, r + 1, c),
            makePos(l, r, c + 1),
            makePos(l, r + 1, c + 1),
          ];
          // Note: Bounds will be validated by consumer if needed.
          supp2D[r][c] = arr;
        }
      }
    }
    SUPPORTS[level] = supp2D;
    CENTER_W[level] = center2D;
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

// Return the set of positions that must be occupied to support a piece at (level,row,col)
export function getSupports(level: 0 | 1 | 2 | 3, row: number, col: number): ReadonlyArray<Position> {
  init();
  const supp = SUPPORTS[level];
  const size = levelSize(level);
  if (!supp || row < 0 || col < 0 || row >= size || col >= size) return [];
  return supp[row][col] || [];
}

// Precomputed center weight in [0,1] for a given position
export function getCenterWeight(level: 0 | 1 | 2 | 3, row: number, col: number): number {
  init();
  const cw = CENTER_W[level];
  const size = levelSize(level);
  if (!cw || row < 0 || col < 0 || row >= size || col >= size) return 0;
  return cw[row][col] ?? 0;
}
