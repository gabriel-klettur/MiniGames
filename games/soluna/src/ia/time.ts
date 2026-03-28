import type { GameState } from '../game/types';
import { generateAllMoves } from './moves';

export interface AdaptiveTimeConfig {
  minMs: number;   // Lower clamp
  maxMs: number;   // Upper clamp
  baseMs: number;  // Base time independent of branching
  perMoveMs: number; // Multiplier per root move (or powered by exponent)
  exponent: number;  // Non-linearity on branching factor
}

const DEFAULT_CFG: AdaptiveTimeConfig = {
  minMs: 200,
  maxMs: 4000,
  baseMs: 150,
  perMoveMs: 35,
  exponent: 1.0,
};

/**
 * computeAdaptiveTimeBudget
 * Estimates a time budget (ms) for the search given the current state's root
 * branching factor. The policy is intentionally simple and deterministic.
 *
 * Policy: baseMs + perMoveMs * (bf ^ exponent), clamped to [minMs, maxMs].
 */
export function computeAdaptiveTimeBudget(
  state: GameState,
  cfg?: Partial<AdaptiveTimeConfig>
): number {
  const c: AdaptiveTimeConfig = { ...DEFAULT_CFG, ...(cfg || {}) };
  // Root branching factor approximated by the number of legal merges at root
  const bf = Math.max(0, generateAllMoves(state).length);
  const raw = c.baseMs + c.perMoveMs * Math.pow(bf, c.exponent);
  const clamped = Math.min(c.maxMs, Math.max(c.minMs, raw));
  return Math.round(clamped);
}
