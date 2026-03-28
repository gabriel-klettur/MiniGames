import { useMemo } from 'react';
import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
import type { AggRow } from '../utils/aggregates';
import { computeAggregates } from '../utils/aggregates';

export function useAggregates(datasets: Array<{ id: string; name: string; color: string; records: InfoIAGameRecord[] }>): Record<string, AggRow[]> {
  return useMemo(() => {
    const out: Record<string, AggRow[]> = {};
    for (const ds of datasets) {
      out[ds.id] = computeAggregates(ds.records);
    }
    return out;
  }, [datasets]);
}
