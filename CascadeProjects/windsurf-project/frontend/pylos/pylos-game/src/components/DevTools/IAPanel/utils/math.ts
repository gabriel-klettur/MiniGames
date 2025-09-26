/**
 * Math utilities for IAPanel UI.
 * These are pure helpers intended to be reused across components and hooks.
 */

/**
 * Clamp a number between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (min > max) [min, max] = [max, min];
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert a current value and limit into a 0..1 ratio, safely handling edge cases.
 */
export function toRatio(current: number, limit?: number): number {
  if (typeof limit !== 'number' || limit <= 0) return 0;
  if (!Number.isFinite(current)) return 0;
  return clamp(current / limit, 0, 1);
}

/**
 * Normalizes an evaluation score to [-1, 1] using tanh for stability.
 * Matches the behavior previously used inline in IAPanel.tsx (v / 25).
 */
export function normEval(score: number): number {
  if (!Number.isFinite(score)) return 0;
  const scaled = Math.tanh(score / 25);
  return clamp(scaled, -1, 1);
}

export default {
  clamp,
  toRatio,
  normEval,
};

