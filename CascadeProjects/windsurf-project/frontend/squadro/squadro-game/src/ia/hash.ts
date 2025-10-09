// Zobrist hashing for Squadro GameState
// Note: uses 53-bit safe integers (JS number) via xor mix; acceptable collision risk for TT.

import type { GameState, Player } from '../game/types';

const PIECE_STATES = ['en_ida', 'en_vuelta', 'retirada'] as const;

const RANDOM_TABLE_SIZE = 1 << 12; // 4096 slots
let randTable: number[] | null = null;

function initTable(): void {
  if (randTable) return;
  randTable = new Array(RANDOM_TABLE_SIZE);
  let seed = 0x9e3779b97f4a7c15n; // golden ratio (64-bit)
  for (let i = 0; i < RANDOM_TABLE_SIZE; i++) {
    seed ^= seed << 13n;
    seed ^= seed >> 7n;
    seed ^= seed << 17n;
    // fold to 53-bit safe number
    const v = Number(seed & 0x1f_ffff_ffff_ffffn);
    randTable[i] = v;
  }
}

function mix(a: number, b: number): number {
  // xorshift-like mix within 53-bit mantissa range
  let x = (a ^ (b + 0x9e3779)) >>> 0;
  x ^= x << 13; x >>>= 0;
  x ^= x >> 7;  x >>>= 0;
  x ^= x << 17; x >>>= 0;
  return x;
}

function idx(owner: Player, lane: number, pos: number, stateIdx: number): number {
  const base = owner === 'Light' ? 0 : 1;
  const k = (((base * 7 + lane) * 16 + pos) * 3 + stateIdx) % RANDOM_TABLE_SIZE;
  return k < 0 ? k + RANDOM_TABLE_SIZE : k;
}

export function hashState(gs: GameState): number {
  initTable();
  let h = 0;
  for (const p of gs.pieces) {
    const sIdx = PIECE_STATES.indexOf(p.state as any);
    const k = idx(p.owner, p.laneIndex, p.pos, Math.max(0, sIdx));
    h ^= randTable![k];
  }
  // include turn
  h = mix(h, gs.turn === 'Light' ? 0x12345 : 0x6789a);
  return h >>> 0; // ensure uint32-like
}
