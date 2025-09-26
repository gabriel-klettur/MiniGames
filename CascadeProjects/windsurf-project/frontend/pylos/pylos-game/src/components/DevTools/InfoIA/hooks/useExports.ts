import { useCallback } from 'react';
import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
import { buildExportTimestampName } from '../utils/date';
import { toCsv } from '../utils/csv';
import { buildOpeningBook } from '../services/book';

export function useExports(params: {
  records: InfoIAGameRecord[];
  compareSets: Array<{ id: string; name: string; color: string; records: InfoIAGameRecord[] }>;
  activeTableSourceId: string;
}) {
  const { records, compareSets, activeTableSourceId } = params;

  const getCurrent = useCallback((): InfoIAGameRecord[] => {
    if (activeTableSourceId === 'local') return records;
    return compareSets.find((s) => s.id === activeTableSourceId)?.records || records;
  }, [activeTableSourceId, compareSets, records]);

  const onExportJSON = useCallback(() => {
    const current = getCurrent();
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_ia_partidas_${buildExportTimestampName()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getCurrent]);

  const onExportBook = useCallback(() => {
    const current = getCurrent();
    const book = buildOpeningBook(current);
    const blob = new Blob([JSON.stringify(book, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `book_${buildExportTimestampName()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getCurrent]);

  const onExportCSV = useCallback(() => {
    const current = getCurrent();
    const rows = current.map((r) => ({
      id: r.id,
      createdAt: new Date(r.createdAt).toLocaleString(),
      depth: r.depth,
      timeMode: r.timeMode,
      timeSeconds: r.timeSeconds ?? '',
      pliesLimit: r.pliesLimit,
      moves: r.moves,
      avgThinkMs: Math.round(r.avgThinkMs),
      totalThinkMs: Math.round(r.totalThinkMs),
      maxWorkersUsed: (typeof r.maxWorkersUsed === 'number' ? r.maxWorkersUsed : '---'),
      winner: r.winner ?? '',
      endedReason: r.endedReason ?? '',
      repeatMax: (typeof r.repeatMax === 'number' ? r.repeatMax : '---'),
      repeatHits: (typeof r.repeatHits === 'number' ? r.repeatHits : '---'),
    }));
    const csv = toCsv(rows as any);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_ia_partidas_${buildExportTimestampName()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getCurrent]);

  return { onExportJSON, onExportBook, onExportCSV };
}
