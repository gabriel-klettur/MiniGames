import type { InfoIAGameRecord } from '../../../../utils/infoiaDb';
import { makeId } from '../../../../utils/infoiaDb';
import { splitCsvLine } from './csv';

/** Parse a CSV exported by InfoIA into InfoIAGameRecord[]. */
export function parseCsvToRecords(text: string): InfoIAGameRecord[] {
  // Normalize BOM and choose delimiter
  let t = text.replace(/^\uFEFF/, '');
  const firstLineEnd = t.indexOf('\n') === -1 ? t.length : t.indexOf('\n');
  const headerProbe = t.slice(0, firstLineEnd);
  const commaCount = (headerProbe.match(/,/g) || []).length;
  const semiCount = (headerProbe.match(/;/g) || []).length;
  const DELIM = semiCount > commaCount ? ';' : ',';

  // Split lines (fields should not contain newlines in our export)
  const rawLines = t.split(/\r?\n/);
  const lines = rawLines.filter((ln) => ln.trim().length > 0);
  if (lines.length === 0) return [];

  const headerRaw = splitCsvLine(lines[0], DELIM);
  const norm = (s: string) => s.replace(/^\uFEFF/, '').trim().toLowerCase();
  const headerMap = new Map<string, number>();
  headerRaw.forEach((h, i) => headerMap.set(norm(h), i));
  const get = (arr: string[], name: string) => arr[headerMap.get(norm(name)) ?? -1] ?? '';
  const parseNum = (s: string): number => {
    const cleaned = s.replace(/\s+/g, '').replace(/,/g, '.');
    const n = Number(cleaned);
    return isFinite(n) ? n : 0;
  };
  const parseNumOrUndef = (s: string): number | undefined => {
    const raw = (s || '').trim();
    if (!raw || raw === '---') return undefined;
    const cleaned = raw.replace(/\s+/g, '').replace(/,/g, '.');
    const n = Number(cleaned);
    return isFinite(n) ? n : undefined;
  };

  const out: InfoIAGameRecord[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = splitCsvLine(lines[r], DELIM);
    if (cols.length === 0) continue;
    const idText = get(cols, 'id');
    const id = (idText && idText.length > 0 ? idText : makeId()).trim();
    const createdAtStr = get(cols, 'createdAt');
    const createdAt = Date.parse(createdAtStr) || Date.now();
    const depth = parseNum(get(cols, 'depth'));
    const timeModeTxt = get(cols, 'timeMode');
    const timeMode = (timeModeTxt === 'auto' ? 'auto' : 'manual') as 'auto' | 'manual';
    const timeSecondsVal = parseNum(get(cols, 'timeSeconds'));
    const timeSeconds = timeMode === 'manual' && timeSecondsVal > 0 ? timeSecondsVal : undefined;
    const pliesLimit = parseNum(get(cols, 'pliesLimit'));
    const moves = parseNum(get(cols, 'moves'));
    const avgThinkMs = parseNum(get(cols, 'avgThinkMs'));
    const totalThinkMs = parseNum(get(cols, 'totalThinkMs'));
    const maxWorkersUsed = parseNumOrUndef(get(cols, 'maxWorkersUsed'));
    const winnerRaw = (get(cols, 'winner') || '').trim();
    const winner = winnerRaw === 'L' || winnerRaw === 'D' ? (winnerRaw as 'L' | 'D') : null;
    const endedReasonText = (get(cols, 'endedReason') || '').trim();
    const endedReason = endedReasonText.length > 0 ? endedReasonText : undefined;
    out.push({
      id,
      createdAt,
      version: 'pylos-infoia-v1',
      depth,
      timeMode,
      timeSeconds,
      pliesLimit,
      moves,
      avgThinkMs,
      totalThinkMs,
      maxWorkersUsed,
      winner,
      endedReason,
      repeatMax: parseNumOrUndef(get(cols, 'repeatMax')),
      repeatHits: parseNumOrUndef(get(cols, 'repeatHits')),
      perMove: [],
    });
  }
  return out;
}

/** Parse a JSON exported by InfoIA into InfoIAGameRecord[]. */
export function parseJsonToRecords(text: string): InfoIAGameRecord[] {
  try {
    const data = JSON.parse(text);
    const list: InfoIAGameRecord[] = Array.isArray(data) ? data : [data];
    const out: InfoIAGameRecord[] = [];
    for (const rec of list) {
      if (!rec || typeof rec !== 'object') continue;
      const anyRec = rec as any;
      if (anyRec.version !== 'pylos-infoia-v1') continue;
      if (!anyRec.id) anyRec.id = makeId();
      out.push(anyRec as InfoIAGameRecord);
    }
    return out;
  } catch (e) {
    console.error('JSON parse error (comparación):', e);
    return [];
  }
}
