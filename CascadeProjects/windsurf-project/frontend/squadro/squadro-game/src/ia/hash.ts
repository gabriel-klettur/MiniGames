// Zobrist hashing for Squadro GameState (64-bit BigInt)
// Mixes per-piece position/state and lane parameters (length/speeds), plus side-to-move.

import type { GameState, Player } from '../game/types';

const PIECE_STATES = ['en_ida', 'en_vuelta', 'retirada'] as const;

const RANDOM_TABLE_SIZE = 1 << 12; // 4096 slots
let randTable: bigint[] | null = null;

function initTable(): void {
  if (randTable) return;
  randTable = new Array(RANDOM_TABLE_SIZE);
  let seed = 0x9e3779b97f4a7c15n; // golden ratio (64-bit)
  for (let i = 0; i < RANDOM_TABLE_SIZE; i++) {
    seed ^= seed << 13n;
    seed ^= seed >> 7n;
    seed ^= seed << 17n;
    randTable[i] = seed & 0xffff_ffff_ffff_ffffn; // 64-bit mask
  }
}

function mix64(a: bigint, b: bigint): bigint {
  // xorshift-like mix on 64-bit
  let x = a ^ (b + 0x9e37n);
  x ^= x << 13n;
  x ^= x >> 7n;
  x ^= x << 17n;
  return x & 0xffff_ffff_ffff_ffffn;
}

function idx(owner: Player, lane: number, pos: number, stateIdx: number): number {
  const base = owner === 'Light' ? 0 : 1;
  const k = (((base * 7 + lane) * 16 + pos) * 3 + stateIdx) % RANDOM_TABLE_SIZE;
  return k < 0 ? k + RANDOM_TABLE_SIZE : k;
}

export function hashState(gs: GameState): bigint {
  initTable();
  let h = 0n;
  for (const p of gs.pieces) {
    const sIdx = PIECE_STATES.indexOf(p.state as any);
    const k = idx(p.owner, p.laneIndex, p.pos, Math.max(0, sIdx));
    h ^= randTable![k];
  }
  // include lane parameters (length, speeds) for both players/lanes
  for (const owner of ['Light', 'Dark'] as const) {
    const lanes = gs.lanesByPlayer[owner];
    for (let i = 0; i < lanes.length; i++) {
      const L = BigInt(lanes[i].length);
      const so = BigInt(lanes[i].speedOut);
      const sb = BigInt(lanes[i].speedBack);
      const tag = BigInt((owner === 'Light' ? 0 : 1) * 17 + i);
      const mixVal = ((L & 0xffffn) << 32n) ^ ((so & 0xfffn) << 16n) ^ (sb & 0xfffn) ^ tag;
      const k = (i + (owner === 'Light' ? 0 : 1) * 37) % RANDOM_TABLE_SIZE;
      h ^= mix64(randTable![k], mixVal);
    }
  }
  // include side to move
  h = mix64(h, gs.turn === 'Light' ? 0x12345n : 0x6789an);
  return h & 0xffff_ffff_ffff_ffffn;
}
