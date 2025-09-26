import type { GameState, Player } from '../game/types';
import { positions, getCell, isFree } from '../game/board';
import { getSquareWindows, getLineWindows, getCenterWeight } from './precomputed';
import { getIAFlags } from './config';
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

  // Phase (tapered eval): 0 opening -> 1 endgame, based on pieces on board
  let pieces = 0;
  for (const p of positions()) {
    const c = getCell(state.board, p);
    if (c !== null) pieces++;
  }
  const totalCells = 30; // 4x4 + 3x3 + 2x2 + 1 = 30
  const t = Math.min(1, Math.max(0, pieces / totalCells));

  // Weights interpolate between opening and endgame
  const Wopen = { height: 0.5, reserves: 12, squares: 2.0, center: 0.5, free: 2.0 } as const;
  const Wend  = { height: 0.8, reserves: 8,  squares: 3.0, center: 0.3, free: 1.5 } as const;
  const W = {
    height: Wopen.height * (1 - t) + Wend.height * t,
    reserves: Wopen.reserves * (1 - t) + Wend.reserves * t,
    squares: Wopen.squares * (1 - t) + Wend.squares * t,
    center: Wopen.center * (1 - t) + Wend.center * t,
    free: Wopen.free * (1 - t) + Wend.free * t,
  };

  // Material (reserves difference)
  const material = (state.reserves[me] - state.reserves[opp]) * W.reserves;

  // Height/position + center preference
  let myPos = 0;
  let oppPos = 0;
  const flags = getIAFlags();
  for (const p of positions()) {
    const cell = getCell(state.board, p);
    if (cell === null) continue;
    const levelWeight = [1, 3, 6, 10][p.level] ?? (p.level + 1);
    let centerBonus: number;
    if (flags.precomputedCenter) {
      centerBonus = getCenterWeight(p.level as 0 | 1 | 2 | 3, p.row, p.col);
    } else {
      const size = 4 - p.level; // 4,3,2,1
      const center = (size - 1) / 2;
      const dist = Math.abs(p.row - center) + Math.abs(p.col - center);
      const maxDist = center * 2 || 1;
      centerBonus = 1 - dist / maxDist;
    }
    const score = W.height * levelWeight * (0.7 + W.center * 0.3 * centerBonus);
    if (cell === me) myPos += score; else if (cell === opp) oppPos += score;
  }

  // Threats: near-complete squares and lines on levels 0..1
  function countSquareThreats(player: Player): number {
    let cnt = 0;
    for (let level = 0 as 0 | 1 | 2 | 3; level <= 2; level = (level + 1) as any) {
      const windows = getSquareWindows(level);
      for (const w of windows) {
        let pMe = 0; let pOp = 0;
        for (const pos of w) {
          const cell = getCell(state.board, pos);
          if (cell === player) pMe++; else if (cell) pOp++;
        }
        if (pOp === 0 && pMe === 3) cnt++;
      }
    }
    return cnt;
  }

  function countLineThreats(player: Player): number {
    let cnt = 0;
    for (let level = 0 as 0 | 1 | 2 | 3; level <= 1; level = (level + 1) as any) {
      const windows = getLineWindows(level);
      const req = level === 0 ? 4 : 3;
      for (const w of windows) {
        let pMe = 0; let pOp = 0;
        for (const pos of w) {
          const cell = getCell(state.board, pos);
          if (cell === player) pMe++; else if (cell) pOp++;
        }
        if (pOp === 0 && pMe === req - 1) cnt++;
      }
    }
    return cnt;
  }

  const myThreats = countSquareThreats(me) + countLineThreats(me);
  const oppThreats = countSquareThreats(opp) + countLineThreats(opp);

  // Free pieces (recoverable) advantage
  let myFree = 0;
  let oppFree = 0;
  for (const p of positions()) {
    const cell = getCell(state.board, p);
    if (cell === me && isFree(state.board, p)) myFree++;
    else if (cell === opp && isFree(state.board, p)) oppFree++;
  }
  const freeAdv = (myFree - oppFree) * W.free;

  const posScore = (myPos - oppPos);
  const threatScore = (myThreats - oppThreats) * W.squares;
  return material + posScore + threatScore + freeAdv;
}
