import { useCallback, useEffect, useRef, useState } from 'react';
import type { InfoIARecord } from '../types';
import { getAllRecords, saveRecord as persistRecord, deleteRecord as storageDelete, clearAllRecords } from '../services/storage';

const LS_KEY = 'soluna.infoia.records.v1';
const DRAFT_KEY = 'soluna.infoia.records.current.v1';

export interface UseRecordsOptions {
  // If true, avoid persisting to LocalStorage to not block UI during long loops
  suspendPersistence?: boolean;
}

export interface UseRecords {
  records: InfoIARecord[];
  setRecords: React.Dispatch<React.SetStateAction<InfoIARecord[]>>;
  // CRUD
  addRecord: (rec: InfoIARecord) => void;
  deleteRecord: (id: string) => void;
  clearAll: () => void;
  // Exports
  exportJSON: () => void;
  exportCSV: () => void;
  exportCSVDetails: () => void;
  // Record actions
  viewRecord: (id: string) => void;
  copyRecord: (id: string) => Promise<void>;
  downloadRecord: (id: string) => void;
  // Force persist immediately
  flushNow: () => void;
}

export function useRecords(_opts: UseRecordsOptions = {}): UseRecords {
  const [records, setRecords] = useState<InfoIARecord[]>([]);
  // Keep a ref to the latest records to allow flush on unload/visibilitychange
  const recordsRef = useRef<InfoIARecord[]>(records);
  useEffect(() => { recordsRef.current = records; }, [records]);
  // No throttle: we will persist immediately on record add to avoid data loss on refresh.

  // Load once (records from IndexedDB) + optional in-progress draft from localStorage for resilience
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dbRecords = await getAllRecords();
        const rawDraft = localStorage.getItem(DRAFT_KEY);
        const list: InfoIARecord[] = [];
        if (rawDraft) {
          try {
            const draft = JSON.parse(rawDraft) as InfoIARecord;
            if (draft && typeof draft === 'object') list.push(draft);
          } catch {}
        }
        if (Array.isArray(dbRecords) && dbRecords.length > 0) list.push(...dbRecords);
        if (!cancelled && list.length) setRecords(list);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // No periodic localStorage persistence: IndexedDB is used via saveRecord on add

  // Ensure we don't lose data if the page is closed/reloaded while persistence is suspended
  useEffect(() => {
    const flush = () => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(recordsRef.current)); } catch {}
    };
    // Flush on unload
    window.addEventListener('beforeunload', flush);
    // Flush on pagehide (mobile-friendly)
    window.addEventListener('pagehide', flush);
    // Flush when tab becomes hidden (e.g., user switches away)
    const onVisibility = () => { if (document.hidden) flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const flushNow = useCallback(() => {
    // No-op: persistence happens per add via IndexedDB; drafts are small and ephemeral
  }, []);

  const addRecord = useCallback((rec: InfoIARecord) => {
    // Build next state synchronously to allow immediate flush
    const next = [rec, ...recordsRef.current];
    recordsRef.current = next;
    setRecords(next);
    // Persist asynchronously using IndexedDB; avoid main-thread blocking
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
      const a = document.createElement('a');
      a.href = url; a.download = 'soluna-infoia.json'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const exportCSV = useCallback(() => {
    try {
      const header = 'id,setId,startedAt,durationMs,moves,winner,p1Depth,p2Depth\n';
      const rows = records.map(r => `${r.id},${r.setId || ''},${r.startedAt},${Math.round(r.durationMs)},${r.moves},${r.winner},${r.p1Depth},${r.p2Depth}`).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'soluna-infoia.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const exportCSVDetails = useCallback(() => {
    try {
      const header = 'id,setId,startedAt,durationMs,moves,winner,p1Depth,p2Depth,moveIndex,moveElapsedMs,moveAt,depthReached,nodes,nps,score,player,depthUsed,applied\n';
      const lines: string[] = [];
      for (const r of records) {
        const base = `${r.id},${r.setId || ''},${r.startedAt},${Math.round(r.durationMs)},${r.moves},${r.winner},${r.p1Depth},${r.p2Depth}`;
        const details = r.details && r.details.length ? r.details : [];
        if (details.length === 0) {
          lines.push(`${base},,,,,,,,,`);
          continue;
        }
        for (const d of details) {
          const line = [
            base,
            d.index ?? '',
            Math.round(d.elapsedMs ?? 0),
            d.at ?? '',
            d.depthReached ?? '',
            d.nodes ?? '',
            d.nps ?? '',
            d.score ?? '',
            d.player ?? '',
            d.depthUsed ?? '',
            d.applied ?? '',
          ].join(',');
          lines.push(line);
        }
      }
      const blob = new Blob([header + lines.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'soluna-infoia-details.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  const viewRecord = useCallback((id: string) => {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    try { alert(`Partida ${id}\nWinner: ${rec.winner}\nMovs: ${rec.moves}\nDuración: ${(rec.durationMs/1000).toFixed(2)}s`); } catch {}
  }, [records]);

  const copyRecord = useCallback(async (id: string) => {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    try { await navigator.clipboard.writeText(JSON.stringify(rec)); } catch {}
  }, [records]);

  const downloadRecord = useCallback((id: string) => {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    try {
      const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `soluna-infoia-${id}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }, [records]);

  return {
    records,
    setRecords,
    addRecord,
    deleteRecord,
    clearAll,
    exportJSON,
    exportCSV,
    exportCSVDetails,
    viewRecord,
    copyRecord,
    downloadRecord,
    flushNow,
  };
}
