import type { GameState, Tower } from '../game/types';

/**
 * FNV-1a 64-bit hash implemented with BigInt for stable 64-bit keys in JS.
 */
export function fnv1a64(str: string): bigint {
  let hash = 0xcbf29ce484222325n; // offset basis
  const prime = 0x100000001b3n; // FNV prime
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = (hash * prime) & 0xffffffffffffffffn; // keep 64-bit
  }
  return hash;
}

/**
 * mix64 — one-way mix of a 64-bit BigInt to spread entropy.
 */
function mix64(x: bigint): bigint {
  x ^= x >> 33n;
  x = (x * 0xff51afd7ed558ccdn) & 0xffffffffffffffffn;
  x ^= x >> 33n;
  x = (x * 0xc4ceb9fe1a85ec53n) & 0xffffffffffffffffn;
  x ^= x >> 33n;
  return x & 0xffffffffffffffffn;
}

function q2(n: number): number {
  // Quantize to 2 decimals without allocations
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/**
 * Compute a stable 64-bit key for a GameState.
 * Allocation-light, commutative (order-independent) XOR over towers.
 * Not incremental (yet), but significantly cheaper than sorting+string concat.
 */
export function computeStateKey(state: GameState): bigint {
  // If an incremental key is present on the state, prefer it
  const z = (state as any).zKey as bigint | undefined;
  if (typeof z === 'bigint') return z & 0xffffffffffffffffn;
  let h = 0n;
  // Encode turn and flags
  h ^= mix64(BigInt(0x9e3779b97f4a7c15n) ^ BigInt(state.currentPlayer));
  h ^= mix64(BigInt(0x94d049bb133111ebn) ^ BigInt(state.lastMover ?? 0));
  if (state.roundOver) h ^= 0x0123456789abcdefn;
  if (state.gameOver) h ^= 0xfedcba9876543210n;

  // XOR each tower's features (id, height, top, position quantized)
  for (let i = 0; i < state.towers.length; i++) {
    const t: Tower = state.towers[i];
    // Derive per-field keys deterministically using FNV over labels
    const id64 = mix64(fnv1a64('id:' + t.id));
    const ht64 = mix64(BigInt(t.height & 0xffff));
    const top64 = mix64(fnv1a64('top:' + String(t.top)));
    const px = q2(t.pos.x);
    const py = q2(t.pos.y);
    const pos64 = mix64((BigInt(px & 0xffffffff) << 32n) | BigInt(py >>> 0));
    // Combine for this tower
    let th = 0n;
    th ^= id64;
    th ^= (ht64 << 17n) & 0xffffffffffffffffn;
    th ^= (top64 << 33n) & 0xffffffffffffffffn;
    th ^= (pos64 << 7n) & 0xffffffffffffffffn;
    h ^= th;
  }

  return h & 0xffffffffffffffffn;
}

// --- Zobrist-like helpers for incremental hashing ---
export function towerZKey(t: Tower): bigint {
  const id64 = mix64(fnv1a64('id:' + t.id));
  const ht64 = mix64(BigInt(t.height & 0xffff));
  const top64 = mix64(fnv1a64('top:' + String(t.top)));
  const px = q2(t.pos.x);
  const py = q2(t.pos.y);
  const pos64 = mix64((BigInt(px & 0xffffffff) << 32n) | BigInt(py >>> 0));
  let th = 0n;
  th ^= id64;
  th ^= (ht64 << 17n) & 0xffffffffffffffffn;
  th ^= (top64 << 33n) & 0xffffffffffffffffn;
  th ^= (pos64 << 7n) & 0xffffffffffffffffn;
  return th & 0xffffffffffffffffn;
}

export function playerZKey(p: number): bigint {
  return mix64(BigInt(0x9e3779b97f4a7c15n) ^ BigInt(p)) & 0xffffffffffffffffn;
}

export function lastMoverZKey(lastMover: number): bigint {
  return mix64(BigInt(0x94d049bb133111ebn) ^ BigInt(lastMover)) & 0xffffffffffffffffn;
}

export function flagsZKey(roundOver: boolean, gameOver: boolean): bigint {
  let f = 0n;
  if (roundOver) f ^= 0x0123456789abcdefn;
  if (gameOver) f ^= 0xfedcba9876543210n;
  return f & 0xffffffffffffffffn;
}
