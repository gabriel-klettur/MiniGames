import type { GameState, Player } from '../game/types';
import { positions, getCell, isFree } from '../game/board';
import { isGameOver } from '../game/rules';

/**
 * Evaluation function for Pylos states.
 * Positive values favor `me`, negative favor the opponent.
 * Heuristic components (lightweight to keep UI responsive):
 * - Material (reserve difference)
 * - Height/position (higher levels more valuable)
 * - Center preference
 * - Free (recoverable) pieces advantage
 */
export function evaluate(state: GameState, me: Player): number {
  const over = isGameOver(state);
  if (over.over) {
    if (!over.winner) return 0;
    return over.winner === me ? Number.POSITIVE_INFINITY / 2 : Number.NEGATIVE_INFINITY / 2;
  }

  const opp: Player = me === 'L' ? 'D' : 'L';

  // Material: reserves difference
  const material = (state.reserves[me] - state.reserves[opp]) * 10;

  // Height/position + center preference
  let myPos = 0;
  let oppPos = 0;
  for (const p of positions()) {
    const cell = getCell(state.board, p);
    if (cell === null) continue;
    // Higher level more valuable; center of each level favored
    const levelWeight = [1, 3, 6, 10][p.level] ?? (p.level + 1);
    const size = 4 - p.level; // 4,3,2,1
    const center = (size - 1) / 2; // 1.5, 1, 0.5, 0
    const dist = Math.abs(p.row - center) + Math.abs(p.col - center);
    const maxDist = center * 2 || 1; // avoid div by 0
    const centerBonus = 1 - dist / maxDist; // in [0,1]
    const score = levelWeight * (0.7 + 0.3 * centerBonus);
    if (cell === me) myPos += score; else if (cell === opp) oppPos += score;
  }

  // Free pieces (recoverable) advantage
  let myFree = 0;
  let oppFree = 0;
  for (const p of positions()) {
    const cell = getCell(state.board, p);
    if (cell === me && isFree(state.board, p)) myFree++;
    else if (cell === opp && isFree(state.board, p)) oppFree++;
  }
  const freeAdv = (myFree - oppFree) * 2;

  return material + (myPos - oppPos) * 0.5 + freeAdv;
}
