import { useMemo } from 'react';

export function useLayoutStyle(showTools: boolean, showInfoIA: boolean): React.CSSProperties | undefined {
  return useMemo(() => {
    if (!(showTools && showInfoIA)) return undefined;
    return {
      ['--board-scale' as any]: '0.75',
      ['--ball-scale' as any]: '0.25',
      ['--hole-scale' as any]: '0.35',
      ['--ball-matrix-scale' as any]: '0.45',
      ['--hole-matrix-scale' as any]: '0.45',
    } as React.CSSProperties;
  }, [showTools, showInfoIA]);
}
