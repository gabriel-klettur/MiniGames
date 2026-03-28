import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
import { buildOpeningBook } from './book';

export type Difficulty = 'facil' | 'medio' | 'dificil';
export type Phase = 'aperturas' | 'medio' | 'cierres';

function filterByDifficulty(records: InfoIAGameRecord[], diff: Difficulty): InfoIAGameRecord[] {
  const range = diff === 'facil' ? [1, 3] : diff === 'medio' ? [4, 7] : [8, 10];
  return records.filter((r) => r.depth >= range[0] && r.depth <= range[1]);
}

export async function clearBooksOnDevServer(): Promise<{ ok: boolean; removed?: number; error?: string }>{
  const res = await fetch('/__dev/clear-books', { method: 'POST' });
  try {
    const data = await res.json();
    return { ok: res.ok, removed: typeof data?.removed === 'number' ? data.removed : undefined, error: data?.error };
  } catch {
    return { ok: res.ok } as any;
  }
}

export async function publishAllBooksToDevServer(params: {
  records: InfoIAGameRecord[];
  minSupportPct?: number;
}): Promise<{ ok: boolean; wrote?: Array<{ path: string; bytes: number }>; filesInfo?: Array<{ relativePath: string; entries: number; bytes: number }>; error?: string }>{
  const { records, minSupportPct } = params;
  const difficulties: Difficulty[] = ['facil', 'medio', 'dificil'];
  const phases: Phase[] = ['aperturas', 'medio', 'cierres'];

  const files: Array<{ relativePath: string; content: string }> = [];
  const filesInfo: Array<{ relativePath: string; entries: number; bytes: number }> = [];
  for (const diff of difficulties) {
    const recs = filterByDifficulty(records, diff);
    for (const phase of phases) {
      const book = buildOpeningBook(recs, { difficulty: diff, phase, minSupportPct });
      const json = JSON.stringify(book, null, 2);
      const rel = `${diff}/${filenameFor(diff, phase)}`;
      files.push({ relativePath: rel, content: json });
      const entries = Array.isArray((book as any)?.entries) ? (book as any).entries.length : 0;
      filesInfo.push({ relativePath: rel, entries, bytes: json.length });
      if (diff === 'medio' && phase === 'medio') {
        files.push({ relativePath: 'medio/medio_book.json', content: json });
        filesInfo.push({ relativePath: 'medio/medio_book.json', entries, bytes: json.length });
      }
    }
  }

  const res = await fetch('/__dev/publish-books', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ files }),
  });
  try {
    const data = await res.json();
    return { ok: res.ok, wrote: data.wrote, filesInfo, error: data.error };
  } catch {
    return { ok: res.ok, filesInfo } as any;
  }
}

function filenameFor(diff: Difficulty, phase: Phase): string {
  return `${diff}_${phase}_book.json`;
}

async function ensureDir(root: any, name: string): Promise<any> {
  // File System Access API directory handle
  // @ts-ignore
  return root.getDirectoryHandle(name, { create: true });
}

async function writeFile(dirHandle: any, fileName: string, contents: string): Promise<void> {
  // @ts-ignore
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  // @ts-ignore
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

export async function publishAllBooksToFS(params: {
  records: InfoIAGameRecord[];
  minSupportPct?: number;
}): Promise<{ wrote: Array<{ path: string; bytes: number }>; skipped: string[] }> {
  const { records, minSupportPct } = params;
  if (typeof (window as any).showDirectoryPicker !== 'function') {
    throw new Error('El navegador no soporta File System Access API. Usa "Exportar Book" y guarda manualmente en public/books/.');
  }
  // Ask user to pick the /public/books directory
  // @ts-ignore
  const root = await (window as any).showDirectoryPicker({ mode: 'readwrite' });

  // Create subdirs
  const dFacil = await ensureDir(root, 'facil');
  const dMedio = await ensureDir(root, 'medio');
  const dDificil = await ensureDir(root, 'dificil');

  const out: Array<{ path: string; bytes: number }> = [];
  const skipped: string[] = [];

  const difficulties: Difficulty[] = ['facil', 'medio', 'dificil'];
  const phases: Phase[] = ['aperturas', 'medio', 'cierres'];

  for (const diff of difficulties) {
    const recs = filterByDifficulty(records, diff);
    const dir = diff === 'facil' ? dFacil : diff === 'medio' ? dMedio : dDificil;
    for (const phase of phases) {
      const book = buildOpeningBook(recs, { difficulty: diff, phase, minSupportPct });
      const json = JSON.stringify(book, null, 2);
      const name = filenameFor(diff, phase);
      await writeFile(dir, name, json);
      out.push({ path: `${diff}/${name}`, bytes: json.length });
      // Compatibility alias: medio/medio_book.json if phase === 'medio'
      if (diff === 'medio' && phase === 'medio') {
        await writeFile(dir, 'medio_book.json', json);
        out.push({ path: `medio/medio_book.json`, bytes: json.length });
      }
    }
  }

  return { wrote: out, skipped };
}
