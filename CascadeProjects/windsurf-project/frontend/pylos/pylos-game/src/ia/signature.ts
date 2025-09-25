import type { Position } from '../game/types';
import { levelSize } from '../game/board';
import type { AIMove } from './moves';

/**
 * Compact move signature (32-bit) used for TT and ordering.
 * Layout (bits low→high):
 * - kind: 1 bit (0 place, 1 lift)
 * - a: 6 bits (place: destIndex, lift: srcIndex)
 * - b: 6 bits (place: 0, lift: destIndex)
 * - recCount: 2 bits (0..2)
 * - rec1: 6 bits (0..31)
 * - rec2: 6 bits (0..31)
 * = 27 bits total (fits in 32)
 */
export type MoveSignature = number;

export function posToIndex(pos: Position): number {
  // Levels: 0 -> 16 cells (0..15), 1 -> 9 (16..24), 2 -> 4 (25..28), 3 -> 1 (29)
  const base = [0, 16, 25, 29][pos.level] ?? 0;
  const size = levelSize(pos.level);
  return base + pos.row * size + pos.col;
}

export function indexToPos(index: number): Position {
  if (index < 16) {
    const row = Math.floor(index / 4); const col = index % 4; return { level: 0, row, col };
  } else if (index < 25) {
    const i = index - 16; const row = Math.floor(i / 3); const col = i % 3; return { level: 1, row, col };
  } else if (index < 29) {
    const i = index - 25; const row = Math.floor(i / 2); const col = i % 2; return { level: 2, row, col };
  }
  return { level: 3, row: 0, col: 0 };
}

export function makeSignature(mv: AIMove): MoveSignature {
  let sig = 0;
  const recs = (mv.recovers ?? []).slice(0, 2);
  const recCount = Math.min(2, recs.length);
  const recIdx1 = recCount >= 1 ? posToIndex(recs[0]) : 0;
  const recIdx2 = recCount >= 2 ? posToIndex(recs[1]) : 0;
  if (mv.kind === 'place') {
    const a = posToIndex(mv.dest);
    const b = 0;
    sig |= 0; // kind 0
    sig |= (a & 0x3f) << 1;
    sig |= (b & 0x3f) << 7;
  } else { // lift
    const a = posToIndex(mv.src);
    const b = posToIndex(mv.dest);
    sig |= 1; // kind 1
    sig |= (a & 0x3f) << 1;
    sig |= (b & 0x3f) << 7;
  }
  sig |= (recCount & 0x3) << 13;
  sig |= (recIdx1 & 0x3f) << 15;
  sig |= (recIdx2 & 0x3f) << 21;
  return sig >>> 0; // force uint32
}

export function sameSignature(a: MoveSignature | undefined, mv: AIMove | undefined): boolean {
  if (a === undefined || !mv) return false;
  return a === makeSignature(mv);
}
