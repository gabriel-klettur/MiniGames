import { useCallback, useState } from 'react';

export type CompareRecord = { id: string; durationMs: number };
export type CompareSet = { id: string; name: string; color: string; records: CompareRecord[] };

function parseCSV(text: string): CompareRecord[] {
  // Expect headers including id,durationMs. Extra columns ignored.
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0]!.split(',').map(h => h.trim());
  const idxId = headers.findIndex(h => /id/i.test(h));
  const idxDur = headers.findIndex(h => /durationms|duration_ms|duration/i.test(h));
  const out: CompareRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(',');
    const id = (cols[idxId] ?? `${i}`).trim();
    const dur = Number((cols[idxDur] ?? '0').trim());
    if (!Number.isFinite(dur)) continue;
    out.push({ id, durationMs: dur });
  }
  return out;
}

async function fileToText(f: File): Promise<string> {
  return await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(r.error);
    r.onload = () => res(String(r.result || ''));
    r.readAsText(f);
  });
}

const COLORS = ['#22c55e', '#eab308', '#f43f5e', '#06b6d4', '#8b5cf6', '#f97316', '#84cc16'];

export function useCompareDatasets() {
  const [sets, setSets] = useState<CompareSet[]>([]);
  const [activeId, setActiveId] = useState<string>('local');

  const addFilesFromFileList = useCallback(async (files: FileList) => {
    const arr = Array.from(files || []);
    for (let i = 0; i < arr.length; i++) {
      const f = arr[i]!;
      try {
        const text = await fileToText(f);
        let recs: CompareRecord[] = [];
        if (/\.json$/i.test(f.name)) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            // Expect array of records with durationMs
            recs = parsed
              .map((r: any, idx: number) => ({ id: r.id ?? `${idx}`, durationMs: Number(r.durationMs ?? 0) }))
              .filter((r: any) => Number.isFinite(r.durationMs));
          }
        } else if (/\.csv$/i.test(f.name)) {
          recs = parseCSV(text);
        }
        if (recs.length > 0) {
          const color = COLORS[(sets.length + i) % COLORS.length];
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          setSets(prev => [...prev, { id, name: f.name, color, records: recs }]);
        }
      } catch {
        // ignore file errors
      }
    }
  }, [sets.length]);

  const removeSet = useCallback((id: string) => setSets(prev => prev.filter(s => s.id !== id)), []);
  const clearSets = useCallback(() => setSets([]), []);
  const compareSets = sets;
  const activeTableSourceId = activeId;
  const setActiveTableSourceId = (id: string) => setActiveId(id);
  return { compareSets, activeTableSourceId, setActiveTableSourceId, addFilesFromFileList, removeSet, clearSets };
}
