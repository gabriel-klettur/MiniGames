import { useMemo } from 'react';
import { clamp } from '../utils/math';

export type TimeMode = 'auto' | 'manual';

export interface TimeBounds {
  minSeconds?: number; // default 0
  maxSeconds?: number; // default 30
}

export function computeLimitMs(mode: TimeMode, seconds: number, bounds: TimeBounds = {}): number | undefined {
  if (mode !== 'manual') return undefined;
  const min = bounds.minSeconds ?? 0;
  const max = bounds.maxSeconds ?? 30;
  const secs = clamp(seconds, min, max);
  return secs * 1000;
}

/**
 * Derives the time budget in milliseconds based on mode and seconds.
 * - auto: undefined (no limit)
 * - manual: clamped seconds * 1000
 */
export function useTimeBudget(mode: TimeMode, seconds: number, bounds: TimeBounds = {}): number | undefined {
  const limitMs = useMemo(() => computeLimitMs(mode, seconds, bounds), [mode, seconds, bounds.minSeconds, bounds.maxSeconds]);
  return limitMs;
}

export default useTimeBudget;

