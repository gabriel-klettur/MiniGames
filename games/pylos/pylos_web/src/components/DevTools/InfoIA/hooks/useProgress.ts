import { useCallback, useRef, useState } from 'react';

export function useProgress() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [targetMs, setTargetMs] = useState<number | undefined>(undefined);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const start = useCallback((target?: number) => {
    setTargetMs(target);
    setElapsedMs(0);
    startRef.current = performance.now();
    const tick = () => {
      if (startRef.current == null) return;
      setElapsedMs(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startRef.current = null;
  }, []);

  return { elapsedMs, targetMs, start, stop } as const;
}
