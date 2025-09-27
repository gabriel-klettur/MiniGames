import { useCallback } from 'react';

/** Reads the repetition-avoidance penalty from localStorage; defaults to 50 if missing/invalid. */
export function useAvoidPenalty() {
  const getAvoidPenalty = useCallback((): number => {
    try {
      const raw = localStorage.getItem('pylos.ia.advanced.v1');
      if (raw) {
        const p = JSON.parse(raw);
        const v = Number(p?.avoidPenalty);
        if (Number.isFinite(v)) return Math.max(0, Math.min(500, Math.floor(v)));
      }
    } catch {}
    return 50;
  }, []);
  return { getAvoidPenalty } as const;
}
