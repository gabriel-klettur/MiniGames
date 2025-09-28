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
  // Optional: penalize with per-key weights (preferred if provided)
  avoidList?: Array<{ hi: number; lo: number; weight: number }>;
  // Optional: novelty bonus: add small bonus if child leads to unseen key
  noveltyKeys?: Array<{ hi: number; lo: number }>;
  noveltyBonus?: number;
  // Optional: root diversification to escape repetition cycles
  diversify?: 'off' | 'epsilon';
  epsilon?: number;
  tieDelta?: number;
  randSeed?: number;
  // Optional: limit epsilon sampling to Top-K root candidates
  rootTopK?: number;
  // Optional: seedable jitter and LMR controls at root, and draw bias for cycles
  rootJitter?: boolean;
  rootJitterProb?: number;
  rootLMR?: boolean;
  drawBias?: number;
  // Optional minimal engine cfg (InfoIA can pass book flags)
  cfg?: {
    bookEnabled?: boolean;
    bookUrl?: string;
    start?: { randomFirstMove?: boolean; seed?: number };
  };
};

const STORAGE_KEY = 'pylos.ia.advanced.v1';

function readStartCfg(): { randomFirstMove?: boolean; seed?: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { randomFirstMove: true };
    const p = JSON.parse(raw);
    const randomFirstMove = typeof p?.startRandomFirstMove === 'boolean' ? p.startRandomFirstMove : true;
    const seed = Number.isFinite(p?.startSeed) ? Math.floor(p.startSeed) : undefined;
    return { randomFirstMove, seed };
  } catch {
    return { randomFirstMove: true };
  }
}

export async function getBestMove(state: GameState, opts: BestMoveOptions) {
  const start = readStartCfg();
  const merged: any = {
    ...opts,
    cfg: {
      ...(opts as any)?.cfg,
      start: { ...((opts as any)?.cfg?.start || {}), ...start },
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
