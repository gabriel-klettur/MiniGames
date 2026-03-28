import { useMemo } from 'react';

export interface UseTimeBudgetArgs {
  timeMode: 'auto' | 'manual';
  timeSeconds: number; // 0..30
  busy: boolean;
  elapsedMs: number;
  busyElapsedMs?: number;
}

export function useTimeBudget({ timeMode, timeSeconds, busy, elapsedMs, busyElapsedMs }: UseTimeBudgetArgs) {
  // limitMs: null means unlimited
  const limitMs: number | null = useMemo(() => (
    timeMode === 'manual' ? Math.max(0, (timeSeconds || 0) * 1000) : null
  ), [timeMode, timeSeconds]);

  const shownElapsedMs = useMemo(() => (
    busy ? (typeof busyElapsedMs === 'number' ? busyElapsedMs : elapsedMs || 0) : (elapsedMs || 0)
  ), [busy, busyElapsedMs, elapsedMs]);

  const ratio = useMemo(() => (
    typeof limitMs === 'number' && limitMs > 0 ? Math.min(1, shownElapsedMs / limitMs) : 0
  ), [limitMs, shownElapsedMs]);

  const isOver = useMemo(() => (
    typeof limitMs === 'number' && limitMs > 0 && shownElapsedMs >= limitMs
  ), [limitMs, shownElapsedMs]);

  return { limitMs, shownElapsedMs, ratio, isOver };
}
