import { useEffect, useRef, useState } from 'react';

export interface ElapsedTimerOptions {
  intervalMs?: number; // default 100ms
}

/**
 * Tracks a smoothly updating elapsed time while `busy` is true,
 * and freezes to the last reported `elapsedMs` when `busy` becomes false.
 * Mirrors the behavior previously implemented inline in IAPanel.tsx.
 */
export function useElapsedTimer(busy: boolean, elapsedMs: number = 0, options: ElapsedTimerOptions = {}): number {
  const { intervalMs = 100 } = options;
  const [localElapsedMs, setLocalElapsedMs] = useState<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (busy) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      startRef.current = now;
      setLocalElapsedMs(0);
      const id = window.setInterval(() => {
        const start = startRef.current ?? (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const cur = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;
        setLocalElapsedMs(cur);
      }, Math.max(16, intervalMs));
      return () => {
        clearInterval(id);
      };
    } else {
      startRef.current = null;
      setLocalElapsedMs(elapsedMs || 0);
    }
  }, [busy, elapsedMs, intervalMs]);

  return busy ? localElapsedMs : (elapsedMs || 0);
}

export default useElapsedTimer;

