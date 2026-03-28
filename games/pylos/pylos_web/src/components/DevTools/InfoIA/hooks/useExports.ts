import { useCallback } from 'react';
import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
import { buildExportTimestampName } from '../utils/date';
import { toCsv } from '../utils/csv';
import { buildOpeningBook, type BuildBookOptions } from '../services/book';
import { publishAllBooksToFS } from '../services/publishBooks';

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
    // Export the 9 standard books: 3 difficulties × 3 phases,
    // using filenames expected at runtime under /public/books/{difficulty}/{difficulty}_{phase}_book.json
    const current = getCurrent();
    // Use a single timestamp across the 9 files for easier grouping
    const ts = buildExportTimestampName();
    const difficulties: Array<Required<Pick<BuildBookOptions, 'difficulty'>>['difficulty']> = ['facil', 'medio', 'dificil'];
    const phases: Array<Required<Pick<BuildBookOptions, 'phase'>>['phase']> = ['aperturas', 'medio', 'cierres'];
    for (const difficulty of difficulties) {
      for (const phase of phases) {
        const book = buildOpeningBook(current, { difficulty, phase });
        const blob = new Blob([JSON.stringify(book, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${difficulty}_${phase}_book_${ts}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  }, [getCurrent]);

  const onExportBookWith = useCallback((opts: Required<Pick<BuildBookOptions, 'phase'>> & Required<Pick<BuildBookOptions, 'difficulty'>> & Pick<BuildBookOptions, 'minSupportPct'>) => {
    const current = getCurrent();
    const book = buildOpeningBook(current, { phase: opts.phase, difficulty: opts.difficulty, minSupportPct: opts.minSupportPct });
    const blob = new Blob([JSON.stringify(book, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Name to match runtime expectation under /public/books/{difficulty}/{difficulty}_{phase}_book.json, plus timestamp for downloads
    a.download = `${opts.difficulty}_${opts.phase}_book_${buildExportTimestampName()}.json`;
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

  const onPublishAllBooks = useCallback(async (opts?: { minSupportPct?: number }) => {
    const current = getCurrent();
    await publishAllBooksToFS({ records: current, minSupportPct: opts?.minSupportPct });
  }, [getCurrent]);

  return { onExportJSON, onExportBook, onExportBookWith, onExportCSV, onPublishAllBooks };
}
