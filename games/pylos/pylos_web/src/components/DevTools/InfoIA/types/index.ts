import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
export type { InfoIAGameRecord };

export type TimeMode = 'auto' | 'manual';
export type { AggRow } from '../utils/aggregates';

export type CompareDataset = {
  id: string;
  name: string;
  source: 'json' | 'csv';
  color: string;
  records: InfoIAGameRecord[];
};
