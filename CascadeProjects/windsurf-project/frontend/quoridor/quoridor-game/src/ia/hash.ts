import type { GameState } from '../game/types.ts';

/**
 * Simple deterministic key for GameState. Not cryptographic.
 * Format: size|cur|Lr,Lc|Dr,Dc|walls(sorted by o,r,c)
 */
export function stateKey(s: GameState): string {
  const walls = s.walls
    .slice()
    .sort((a, b) => (a.o === b.o ? 0 : a.o < b.o ? -1 : 1) || a.r - b.r || a.c - b.c)
    .map((w) => `${w.o}${w.r},${w.c}`)
    .join(';');
  return `${s.size}|${s.current}|${s.pawns.L.row},${s.pawns.L.col}|${s.pawns.D.row},${s.pawns.D.col}|${walls}`;
}
