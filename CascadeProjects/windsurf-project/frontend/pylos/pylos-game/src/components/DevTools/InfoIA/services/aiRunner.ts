import { computeBestMoveAsync } from '../../../../ia';
import { applyMove } from '../../../../ia/moves';
import type { AIMove } from '../../../../ia/moves';
import { isGameOver } from '../../../../game/rules';
import type { GameState } from '../../../../game/types';

export type BestMoveOptions = {
  depth: number;
  timeMs?: number;
  workers?: 'auto' | number;
  signal?: AbortSignal;
  // Optional: penalize moves that lead to avoided repetition keys at the root
  avoidKeys?: Array<{ hi: number; lo: number }>;
  avoidPenalty?: number;
};

const STORAGE_KEY = 'pylos.ia.advanced.v1';

function readStartCfg(): { randomFirstMove?: boolean; seed?: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    const randomFirstMove = typeof p?.startRandomFirstMove === 'boolean' ? p.startRandomFirstMove : undefined;
    const seed = Number.isFinite(p?.startSeed) ? Math.floor(p.startSeed) : undefined;
    return { randomFirstMove, seed };
  } catch {
    return {};
  }
}

export async function getBestMove(state: GameState, opts: BestMoveOptions) {
  const start = readStartCfg();
  const merged: any = {
    ...opts,
    cfg: {
      start,
    },
  };
  return computeBestMoveAsync(state, merged);
}

export function apply(state: GameState, move: AIMove) {
  return applyMove(state, move);
}

export function checkGameOver(state: GameState) {
  return isGameOver(state);
}
