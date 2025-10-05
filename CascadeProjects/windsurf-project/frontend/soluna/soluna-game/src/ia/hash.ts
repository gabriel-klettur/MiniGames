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

function round2(n: number): string {
  // Fixed 2 decimals to stabilize float positions in signatures
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function towerSignature(t: Tower): string {
  // Compact canonical signature capturing merge-relevant attributes
  return `${t.top}#${t.height}@${round2(t.pos.x)},${round2(t.pos.y)}`;
}

/**
 * Compute a stable 64-bit key for a GameState.
 * Non-incremental approach: sort tower signatures, join, include turn/round flags.
 */
export function computeStateKey(state: GameState): bigint {
  const sigs = state.towers.map(towerSignature).sort();
  const turn = state.currentPlayer;
  const last = state.lastMover ?? 0;
  const roundOver = state.roundOver ? 1 : 0;
  const gameOver = state.gameOver ? 1 : 0;
  const payload = `${turn}|${last}|${roundOver}|${gameOver}|${sigs.join(';')}`;
  return fnv1a64(payload);
}
