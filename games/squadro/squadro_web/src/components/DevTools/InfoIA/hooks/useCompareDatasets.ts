import { useCallback, useState } from 'react';

export type CompareSet = {
  id: string;
  name: string;
  color: string;
  records: Array<{ durationMs: number }>;
};

function randomColor(): string {
  const colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899'];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function useCompareDatasets() {
  const [compareSets, setCompareSets] = useState<CompareSet[]>([]);

  const addFilesFromFileList = useCallback(async (files: FileList) => {
    const arr = Array.from(files);
    for (const f of arr) {
      try {
        const text = await f.text();
        const json = JSON.parse(text);
        const recs = Array.isArray(json) ? json : (Array.isArray(json?.records) ? json.records : []);
        const flat = recs.map((r: any) => ({ durationMs: Number(r?.durationMs || 0) })).filter((x: any) => Number.isFinite(x.durationMs));
        setCompareSets(prev => [{ id: `${f.name}-${Date.now()}`, name: f.name, color: randomColor(), records: flat }, ...prev]);
      } catch {
        // ignore malformed files
      }
    }
  }, []);

  const removeSet = useCallback((id: string) => {
    setCompareSets(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearSets = useCallback(() => setCompareSets([]), []);

  return { compareSets, addFilesFromFileList, removeSet, clearSets };
}
