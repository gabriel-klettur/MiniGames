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
};

export async function getBestMove(state: GameState, opts: BestMoveOptions) {
  return computeBestMoveAsync(state, opts as any);
}

export function apply(state: GameState, move: AIMove) {
  return applyMove(state, move);
}

export function checkGameOver(state: GameState) {
  return isGameOver(state);
}
