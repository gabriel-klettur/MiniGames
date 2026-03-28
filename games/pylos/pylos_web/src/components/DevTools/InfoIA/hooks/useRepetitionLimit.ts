import { useCallback } from 'react';

/** Reads the repetition limit (repeatMax) from localStorage; defaults to 3 if missing/invalid. */
export function useRepetitionLimit() {
  const getRepeatMax = useCallback((): number => {
    try {
      const raw = localStorage.getItem('pylos.ia.advanced.v1');
      if (raw) {
        const p = JSON.parse(raw);
        const v = Number(p?.repeatMax);
        if (Number.isFinite(v)) return Math.max(1, Math.min(10, Math.floor(v)));
      }
    } catch {}
    return 3;
  }, []);
  return { getRepeatMax } as const;
}
