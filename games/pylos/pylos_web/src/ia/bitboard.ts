import type { Board, Position } from '../game/types';
import { positions, getCell, levelSize } from '../game/board';
import { posIndex } from './zobrist';

export type Bitboards = { L: bigint; D: bigint };

// Precomputed masks (lazy init)
const SUPPORTS_MASK: bigint[] = new Array(30).fill(0n); // for each index i: bitmask of supports (below) needed to place at i
const ABOVE_OF_MASK: bigint[] = new Array(30).fill(0n); // for each index i: bitmask of above positions that depend on i
let inited = false;

function idxOf(p: Position): number {
  return posIndex(p.level, p.row, p.col);
}

function bit(idx: number): bigint {
  return 1n << BigInt(idx >>> 0);
}

function ensureInit(): void {
  if (inited) return;
  inited = true;
  // Precompute supports for each cell (by index)
  for (const p of positions()) {
    const i = idxOf(p);
    if (p.level === 0) {
      SUPPORTS_MASK[i] = 0n;
    } else {
      const l = p.level - 1;
      const supp: Position[] = [
        { level: l, row: p.row, col: p.col },
        { level: l, row: p.row + 1, col: p.col },
        { level: l, row: p.row, col: p.col + 1 },
        { level: l, row: p.row + 1, col: p.col + 1 },
      ];
      let m = 0n;
      for (const s of supp) {
        // Bounds check using level size
        const size = levelSize(l);
        if (s.row >= 0 && s.col >= 0 && s.row < size && s.col < size) {
          m |= bit(idxOf(s));
        }
      }
      SUPPORTS_MASK[i] = m;
    }
  }
  // Precompute for each cell which above cells (level+1) can use it as part of their 2x2 support
  for (const p of positions()) {
    const i = idxOf(p);
    if (p.level >= 3) { ABOVE_OF_MASK[i] = 0n; continue; }
    const lAbove = p.level + 1;
    const sizeA = levelSize(lAbove);
    let m = 0n;
    // Above cells whose 2x2 includes (p.row, p.col) are at (r,c) with r in {p.row-1, p.row}, c in {p.col-1, p.col}
    for (let dr = -1 as 0 | -1; dr <= 0; dr++) {
      for (let dc = -1 as 0 | -1; dc <= 0; dc++) {
        const ar = p.row + dr;
        const ac = p.col + dc;
        if (ar >= 0 && ac >= 0 && ar < sizeA && ac < sizeA) {
          m |= bit(posIndex(lAbove, ar, ac));
        }
      }
    }
    ABOVE_OF_MASK[i] = m;
  }
}

export function boardToBitboards(board: Board): Bitboards {
  let L = 0n;
  let D = 0n;
  for (const p of positions()) {
    const cell = getCell(board, p);
    if (cell === 'L') L |= bit(idxOf(p));
    else if (cell === 'D') D |= bit(idxOf(p));
  }
  return { L, D };
}

export function occupiedUnion(bb: Bitboards): bigint {
  return (bb.L | bb.D);
}

// Check if a destination index is supported given union occupancy
export function isSupportedBB(destIdx: number, occ: bigint): boolean {
  ensureInit();
  // Level 0 always supported (no supports required)
  if (destIdx >= 0 && destIdx <= 15) return true;
  const need = SUPPORTS_MASK[destIdx] || 0n;
  // All required supports must be occupied
  return (need & ~occ) === 0n;
}

// Returns true if the piece at index i supports any above piece that is currently fully supported (hence not free)
export function isSupportingAnyBB(i: number, occ: bigint): boolean {
  ensureInit();
  const aboveMask = ABOVE_OF_MASK[i] || 0n;
  if (aboveMask === 0n) return false;
  // Simpler approach for clarity and robustness over tiny space (<=30 cells):
  for (let a = 0; a < 30; a++) {
    if (((aboveMask >> BigInt(a)) & 1n) === 0n) continue;
    // If above cell is occupied and its supports are fully occupied, then i is supporting something
    if (((occ >> BigInt(a)) & 1n) !== 0n) {
      const need = SUPPORTS_MASK[a] || 0n;
      if ((need & ~occ) === 0n) return true;
    }
  }
  return false;
}

export function isFreeBB(i: number, occ: bigint): boolean {
  ensureInit();
  // Cell must be occupied to consider free-ness; caller usually ensures presence, but we handle anyway
  if (((occ >> BigInt(i)) & 1n) === 0n) return false;
  return !isSupportingAnyBB(i, occ);
}
