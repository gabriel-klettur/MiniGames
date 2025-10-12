import { useCallback, useEffect, useRef, useState } from 'react';
import type { InfoIARecord } from '../types';
import { getAllRecords, saveRecord as persistRecord, deleteRecord as storageDelete, clearAllRecords } from '../services/storage';

export interface UseRecordsOptions { suspendPersistence?: boolean }

export interface UseRecords {
  records: InfoIARecord[];
  setRecords: React.Dispatch<React.SetStateAction<InfoIARecord[]>>;
  addRecord: (rec: InfoIARecord) => void;
  deleteRecord: (id: string) => void;
  clearAll: () => void;
  exportJSON: () => void;
  exportCSV: () => void;
  exportCSVDetails: () => void;
  viewRecord: (id: string) => void;
  copyRecord: (id: string) => Promise<void>;
  downloadRecord: (id: string) => void;
  flushNow: () => void;
}

export function useRecords(_opts: UseRecordsOptions = {}): UseRecords {
  const [records, setRecords] = useState<InfoIARecord[]>([]);
  const recordsRef = useRef<InfoIARecord[]>(records);
  useEffect(() => { recordsRef.current = records; }, [records]);

  // Initial load from IndexedDB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dbRecords = await getAllRecords();
        if (!cancelled && dbRecords && dbRecords.length) setRecords(dbRecords);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const flush = useCallback(() => {
    // No-op: we persist per-add via IndexedDB
  }, []);

  useEffect(() => {
    const onFlush = () => flush();
    window.addEventListener('beforeunload', onFlush);
    window.addEventListener('pagehide', onFlush);
    const onVisibility = () => { if (document.hidden) flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', onFlush);
      window.removeEventListener('pagehide', onFlush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [flush]);

  const addRecord = useCallback((rec: InfoIARecord) => {
    const next = [rec, ...recordsRef.current];
    recordsRef.current = next;
    setRecords(next);
    try { void persistRecord(rec); } catch {}
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    try { void storageDelete(id); } catch {}
  }, []);

  const clearAll = useCallback(() => {
    setRecords([]);
    try { void clearAllRecords(); } catch {}
  }, []);

  const exportJSON = useCallback(() => {
    try {
      const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'squadro-infoia.json'; a.click(); URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const exportCSV = useCallback(() => {
    try {
      const header = 'id,startedAt,durationMs,moves,winner,p1Depth,p2Depth\n';
      const rows = records.map(r => `${r.id},${r.startedAt},${Math.round(r.durationMs)},${r.moves},${r.winner},${r.p1Depth},${r.p2Depth}`).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'squadro-infoia.csv'; a.click(); URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const exportCSVDetails = useCallback(() => {
    try {
      const header = [
        'id','startedAt','durationMs','moves','winner','p1Depth','p2Depth',
        'moveIndex','moveElapsedMs','moveAt','depthReached','nodes','nps','score','player','depthUsed','applied',
        // Heuristics raw
        'tt_probes','tt_hits','tt_hit_rate','cutoffs','pvs_re','lmr','asp_re','hashMoveUsed','killersTried','historyUpdates',
        'qPlies','qNodes','lmpPrunes','futilityPrunes','iidProbes','tbHits',
        // Normalized per 1k nodes (when nodes>0)
        'pvs_re_per_1k','lmr_per_1k','cutoffs_per_1k','lmp_per_1k','fut_per_1k'
      ].join(',') + '\n';
      const lines: string[] = [];
      for (const r of records) {
        const base = `${r.id},${r.startedAt},${Math.round(r.durationMs)},${r.moves},${r.winner},${r.p1Depth},${r.p2Depth}`;
        const details = r.details && r.details.length ? r.details : [];
        if (details.length === 0) { lines.push(`${base},,,,,,,,,,,,,,,,,,,,,,,,,,,,,`); continue; }
        for (const d of details) {
          const ex = d.explain || {} as any;
          const probes = Number(ex.ttProbes || 0);
          const hits = Number(ex.ttHits || 0);
          const hitRate = probes > 0 ? Math.round((hits / probes) * 100) : 0;
          const nodes = Number(d.nodes || 0);
          const per1k = (v: number) => nodes > 0 ? (v * 1000) / nodes : 0;
          const line = [
            base,
            d.index ?? '',
            Math.round(d.elapsedMs ?? 0),
            d.at ?? '',
            d.depthReached ?? '',
            nodes || '',
            d.nps ?? '',
            d.score ?? '',
            d.player ?? '',
            d.depthUsed ?? '',
            d.applied ?? '',
            // Heuristics raw
            probes,
            hits,
            hitRate,
            ex.cutoffs || 0,
            ex.pvsReSearches || 0,
            ex.lmrReductions || 0,
            ex.aspReSearches || 0,
            ex.hashMoveUsed ? 1 : 0,
            ex.killersTried || 0,
            ex.historyUpdates || 0,
            ex.qPlies || 0,
            ex.qNodes || 0,
            ex.lmpPrunes || 0,
            ex.futilityPrunes || 0,
            ex.iidProbes || 0,
            ex.tbHits || 0,
            // Normalized per 1k nodes
            per1k(ex.pvsReSearches || 0).toFixed(2),
            per1k(ex.lmrReductions || 0).toFixed(2),
            per1k(ex.cutoffs || 0).toFixed(2),
            per1k(ex.lmpPrunes || 0).toFixed(2),
            per1k(ex.futilityPrunes || 0).toFixed(2),
          ].join(',');
          lines.push(line);
        }
      }
      const blob = new Blob([header + lines.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'squadro-infoia-details.csv'; a.click(); URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const viewRecord = useCallback((id: string) => {
    const rec = records.find(r => r.id === id); if (!rec) return;
    try { alert(`Partida ${id}\nWinner: ${rec.winner}\nMovs: ${rec.moves}\nDuración: ${(rec.durationMs/1000).toFixed(2)}s`); } catch {}
  }, [records]);

  const copyRecord = useCallback(async (id: string) => {
    const rec = records.find(r => r.id === id); if (!rec) return;
    try { await navigator.clipboard.writeText(JSON.stringify(rec)); } catch {}
  }, [records]);

  const downloadRecord = useCallback((id: string) => {
    const rec = records.find(r => r.id === id); if (!rec) return;
    try {
      const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `squadro-infoia-${id}.json`; a.click(); URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const flushNow = useCallback(() => { /* IndexedDB already persisted */ }, []);

  return { records, setRecords, addRecord, deleteRecord, clearAll, exportJSON, exportCSV, exportCSVDetails, viewRecord, copyRecord, downloadRecord, flushNow };
}
