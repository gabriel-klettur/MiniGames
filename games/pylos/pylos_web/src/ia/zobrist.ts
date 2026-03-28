import type { GameState, Player } from '../game/types';
import { positions, getCell } from '../game/board';

/**
 * Zobrist hashing for Pylos.
 * 64-bit key represented as two uint32 parts {hi, lo}.
 * Includes occupancy (player,cell), side-to-move, and reserves buckets (0..15).
 */
export type Key64 = { hi: number; lo: number };

function mul32(a: number, b: number): number {
  // 32-bit multiply with imul
  return Math.imul(a | 0, b | 0) | 0;
}

class PRNG {
  private s: number;
  constructor(seed = 0x9e3779b9) { this.s = seed | 0; }
  next32(): number {
    // xorshift-like
    let x = this.s | 0;
    x ^= x << 13; x |= 0;
    x ^= x >>> 17; x |= 0;
    x ^= x << 5; x |= 0;
    this.s = x | 0;
    // ensure non-zero and full 32-bit range
    return (x | 0) ^ 0xa5a5a5a5;
  }
}

const TABLE = (() => {
  const prng = new PRNG(0xC0FFEE11);
  // For each player (2) and each cell index (30 usable positions), two 32-bit numbers (hi/lo)
  const cells = 30;
  const players = 2; // 0 -> 'L', 1 -> 'D'
  const occHi = new Uint32Array(players * cells);
  const occLo = new Uint32Array(players * cells);
  for (let i = 0; i < players * cells; i++) {
    occHi[i] = prng.next32() >>> 0;
    occLo[i] = prng.next32() >>> 0;
  }
  // Side to move
  const stmHi = prng.next32() >>> 0;
  const stmLo = prng.next32() >>> 0;
  // Reserves buckets per player (0..15 inclusive is enough for frontend game)
  const RMAX = 16;
  const resHi = new Uint32Array(players * RMAX);
  const resLo = new Uint32Array(players * RMAX);
  for (let i = 0; i < players * RMAX; i++) {
    resHi[i] = prng.next32() >>> 0;
    resLo[i] = prng.next32() >>> 0;
  }
  return { occHi, occLo, stmHi, stmLo, resHi, resLo };
})();

function xor64(a: Key64, hi: number, lo: number): Key64 {
  return { hi: (a.hi ^ (hi >>> 0)) >>> 0, lo: (a.lo ^ (lo >>> 0)) >>> 0 };
}

function playerIdx(p: Player): number { return p === 'L' ? 0 : 1; }

export function posIndex(level: number, row: number, col: number): number {
  if (level === 0) return row * 4 + col; // 0..15
  if (level === 1) return 16 + row * 3 + col; // 16..24
  if (level === 2) return 25 + row * 2 + col; // 25..28
  return 29; // level 3
}

export function computeKey(state: GameState): Key64 {
  let k: Key64 = { hi: 0x12345678, lo: 0x9abcdef0 };
  // Occupancy
  for (const p of positions()) {
    const cell = getCell(state.board, p);
    if (cell === null) continue;
    const pi = playerIdx(cell);
    const idx = posIndex(p.level, p.row, p.col);
    const off = pi * 30 + idx;
    k = xor64(k, TABLE.occHi[off], TABLE.occLo[off]);
  }
  // Side to move
  if (state.currentPlayer === 'D') {
    k = xor64(k, TABLE.stmHi, TABLE.stmLo);
  }
  // Reserves (bucketed)
  const rL = Math.max(0, Math.min(15, state.reserves['L'] | 0));
  const rD = Math.max(0, Math.min(15, state.reserves['D'] | 0));
  k = xor64(k, TABLE.resHi[0 * 16 + rL], TABLE.resLo[0 * 16 + rL]);
  k = xor64(k, TABLE.resHi[1 * 16 + rD], TABLE.resLo[1 * 16 + rD]);
  return k;
}

export function keyToIndex(key: Key64, mask: number): number {
  // Use low 32-bits for indexing; mixing with hi improves distribution
  const mixed = ((key.lo ^ mul32(key.hi, 0x45d9f3b)) >>> 0);
  return mixed & mask;
}
