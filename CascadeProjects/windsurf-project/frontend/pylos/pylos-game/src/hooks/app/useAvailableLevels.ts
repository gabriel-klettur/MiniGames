import { useMemo } from 'react';
import type { Board } from '../../game/types';
import { positions, isSupported } from '../../game/board';

export type AvailableLevels = Record<0 | 1 | 2 | 3, boolean>;

export function useAvailableLevels(board: Board): AvailableLevels {
  return useMemo(() => {
    const avail: AvailableLevels = { 0: true, 1: false, 2: false, 3: false } as any;
    for (let l = 1 as 0 | 1 | 2 | 3; l <= 3; l = (l + 1) as 0 | 1 | 2 | 3) {
      const someSupported = positions(l).some((p) => isSupported(board, p));
      (avail as any)[l] = someSupported;
    }
    return avail;
  }, [board]);
}
