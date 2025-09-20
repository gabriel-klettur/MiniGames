import { useCallback, useState, useEffect } from 'react';

export type BoardMode = 'pyramid' | 'stacked';

/**
 * useBoardMode — gestiona el modo de vista del tablero con persistencia en localStorage.
 */
export function useBoardMode(
  storageKey: string = 'pylos.boardMode',
  defaultMode: BoardMode = 'pyramid'
): [BoardMode, (mode: BoardMode) => void, () => void] {
  const [mode, setMode] = useState<BoardMode>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'pyramid' || saved === 'stacked') return saved;
    } catch {
      // ignore
    }
    return defaultMode;
  });

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, mode);
    } catch {
      // ignore persistence errors
    }
  }, [mode, storageKey]);

  const set = useCallback((m: BoardMode) => setMode(m), []);
  const toggle = useCallback(() => {
    setMode((m) => (m === 'pyramid' ? 'stacked' : 'pyramid'));
  }, []);

  return [mode, set, toggle];
}
