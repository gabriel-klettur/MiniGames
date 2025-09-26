import { useCallback, useState } from 'react';
import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
import { datasetColors } from '../utils/colors';
import { parseCsvToRecords, parseJsonToRecords } from '../utils/parse';
import type { CompareDataset } from '../types';

export function useCompareDatasets() {
  const [compareSets, setCompareSets] = useState<CompareDataset[]>([]);
  const [activeTableSourceId, setActiveTableSourceId] = useState<string>('local');

  const pickDatasetColor = useCallback((idx: number) => datasetColors[idx % datasetColors.length], []);

  const addFilesFromFileList = useCallback(async (files: FileList) => {
    const newSets: CompareDataset[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const text = await f.text();
        let records: InfoIAGameRecord[] = [];
        if (/\.json$/i.test(f.name) || f.type.includes('json')) {
          records = parseJsonToRecords(text);
        } else if (/\.csv$/i.test(f.name) || f.type.includes('csv') || f.type.includes('comma-separated')) {
          records = parseCsvToRecords(text);
        } else {
          // Try JSON first, then CSV as fallback
          records = parseJsonToRecords(text);
          if (records.length === 0) records = parseCsvToRecords(text);
        }
        if (records.length > 0) {
          newSets.push({
            id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
            name: f.name,
            source: (/\.csv$/i.test(f.name) ? 'csv' : 'json'),
            color: pickDatasetColor(compareSets.length + newSets.length),
            records,
          });
        }
      } catch (err) {
        console.error('Error leyendo archivo de comparación:', f.name, err);
      }
    }
    setCompareSets((prev) => [...prev, ...newSets]);
  }, [compareSets.length, pickDatasetColor]);

  const removeSet = useCallback((id: string) => {
    setCompareSets((prev) => prev.filter((s) => s.id !== id));
    setActiveTableSourceId((prev) => (prev === id ? 'local' : prev));
  }, []);

  const clearSets = useCallback(() => {
    setCompareSets([]);
    setActiveTableSourceId('local');
  }, []);

  return {
    compareSets,
    activeTableSourceId,
    setActiveTableSourceId,
    addFilesFromFileList,
    removeSet,
    clearSets,
  } as const;
}
