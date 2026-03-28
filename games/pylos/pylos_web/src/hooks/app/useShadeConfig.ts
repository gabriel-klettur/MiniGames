import { useMemo } from 'react';
import type { AvailableLevels } from './useAvailableLevels';

export function useShadeConfig(
  available: AvailableLevels,
  shadeOnlyAvailable: boolean,
  noShade: { 0: boolean; 1: boolean; 2: boolean; 3: boolean }
): { 0: boolean; 1: boolean; 2: boolean; 3: boolean } {
  return useMemo(() => {
    if (!shadeOnlyAvailable) return noShade;
    return {
      0: !available[0],
      1: !available[1],
      2: !available[2],
      3: !available[3],
    } as { 0: boolean; 1: boolean; 2: boolean; 3: boolean };
  }, [available[0], available[1], available[2], available[3], shadeOnlyAvailable, noShade[0], noShade[1], noShade[2], noShade[3]]);
}
