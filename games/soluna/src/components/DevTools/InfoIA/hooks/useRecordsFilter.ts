import { useMemo, useState } from 'react';
import type { InfoIARecord } from '../types';

export type WinnerFilter = 'all' | '1' | '2' | '0';
export type GroupMode = 'set' | 'depth' | 'none';

export function useRecordsFilter(records: InfoIARecord[]) {
  const [winnerFilter, setWinnerFilter] = useState<WinnerFilter>('all');
  const [minDur, setMinDur] = useState<string>('');
  const [maxDur, setMaxDur] = useState<string>('');
  const [groupMode, setGroupMode] = useState<GroupMode>('set');

  const filteredRecords = useMemo(() => {
    let arr = records;
    if (winnerFilter !== 'all') {
      const w = Number(winnerFilter) as 0 | 1 | 2;
      arr = arr.filter(r => r.winner === w);
    }
    const minS = Number(minDur);
    const maxS = Number(maxDur);
    if (!Number.isNaN(minS) && minDur !== '') arr = arr.filter(r => r.durationMs >= minS * 1000);
    if (!Number.isNaN(maxS) && maxDur !== '') arr = arr.filter(r => r.durationMs <= maxS * 1000);
    return arr;
  }, [records, winnerFilter, minDur, maxDur]);

  return {
    winnerFilter,
    setWinnerFilter,
    minDur,
    setMinDur,
    maxDur,
    setMaxDur,
    groupMode,
    setGroupMode,
    filteredRecords,
    groupBySet: groupMode === 'set',
    groupByDepth: groupMode === 'depth',
  } as const;
}
