import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { initialState, isGameOver } from '../game/rules';
import { applyMove } from '../ia/moves';
import { computeBestMoveAsync } from '../ia';
import type { AIMove } from '../ia/moves';
import { dbClear, dbDelete, dbGetAll, dbSave, makeId } from '../utils/infoiaDb';
import type { InfoIAGameRecord } from '../utils/infoiaDb';
import { computeKey } from '../ia/zobrist';
import { makeSignature } from '../ia/signature';

type TimeMode = 'auto' | 'manual';

function fmtDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

// Build timestamp for filenames as: day_month_year__hora_minuto_segundo
function pad2(n: number): string { return String(n).padStart(2, '0'); }
function buildExportTimestampName(date: Date = new Date()): string {
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const second = pad2(date.getSeconds());
  return `${day}_${month}_${year}__${hour}_${minute}_${second}`;
}

function toCsv(rows: Array<Record<string, string | number | null | undefined>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

export default function InfoIA() {
  const [records, setRecords] = useState<InfoIAGameRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [running, setRunning] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);
  const moveStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const [moveElapsedMs, setMoveElapsedMs] = useState<number>(0);
  const [moveTargetMs, setMoveTargetMs] = useState<number | undefined>(undefined);
  const [moveIndex, setMoveIndex] = useState<number>(0);
  
  // Comparison datasets for Charts tab
  type CompareDataset = {
    id: string;
    name: string; // usually filename
    source: 'json' | 'csv';
    color: string; // base color for this dataset
    records: InfoIAGameRecord[];
  };
  const [compareSets, setCompareSets] = useState<CompareDataset[]>([]);
  const compareInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTableSourceId, setActiveTableSourceId] = useState<string>('local');
  // Responsive chart container (ResizeObserver)
  const chartBoxRef = useRef<HTMLDivElement | null>(null);
  const [chartW, setChartW] = useState<number>(0);
  const [chartH, setChartH] = useState<number>(0);

  // Controls
  const [depth, setDepth] = useState<number>(3);
  const [timeMode, setTimeMode] = useState<TimeMode>('manual');
  const [timeSeconds, setTimeSeconds] = useState<number>(8);
  const [pliesLimit, setPliesLimit] = useState<number>(80);
  const [gamesCount, setGamesCount] = useState<number>(5);
 
  // Tabs UI: 'sim' for Simulaciones y Métricas, 'charts' for Gráficos
  const [activeTab, setActiveTab] = useState<'sim' | 'charts'>('sim');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await dbGetAll();
      // Newest first
      setRecords(all.sort((a, b) => b.createdAt - a.createdAt));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // Observe container size and compute responsive chart dimensions
  useEffect(() => {
    if (activeTab !== 'charts') return; // only when charts are visible
    const el = chartBoxRef.current;
    if (!el) return;
    const compute = (w: number) => {
      const width = Math.max(320, Math.floor(w));
      // Height scales with width but clamped for readability
      const height = Math.max(260, Math.min(560, Math.round(width * 0.5)));
      setChartW(width);
      setChartH(height);
    };
    // Initial measure right after tab becomes active
    compute(el.clientWidth || el.getBoundingClientRect().width || 0);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const w = entry.contentRect?.width ?? el.clientWidth;
      compute(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeTab]);

  const timeMs = useMemo<number | undefined>(() => {
    if (timeMode === 'manual') return Math.max(0, Math.min(30, timeSeconds)) * 1000;
    return undefined; // Auto: sin límite
  }, [timeMode, timeSeconds]);

  const startProgress = useCallback((target?: number) => {
    setMoveTargetMs(target);
    moveStartRef.current = performance.now();
    setMoveElapsedMs(0);
    const tick = () => {
      if (moveStartRef.current == null) return;
      setMoveElapsedMs(performance.now() - moveStartRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopProgress = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    moveStartRef.current = null;
  }, []);

  const runOneGame = useCallback(async (): Promise<InfoIAGameRecord> => {
    const id = makeId();
    const createdAt = Date.now();
    let state = initialState();
    let moves = 0;
    let totalThinkMs = 0;
    const perMove: { elapsedMs: number; depthReached?: number; nodes?: number; nps?: number; score?: number; keyHi?: number; keyLo?: number; moveSig?: number }[] = [];
    // Repetition tracking (based on IAPanel advanced config in localStorage or default 3)
    const readRepeatMax = (): number => {
      try {
        const raw = localStorage.getItem('pylos.ia.advanced.v1');
        if (raw) {
          const p = JSON.parse(raw);
          const v = Number(p?.repeatMax);
          if (Number.isFinite(v)) return Math.max(1, Math.min(10, Math.floor(v)));
        }
      } catch {}
      return 3;
    };
    const repeatMax = readRepeatMax();
    const repCounts = new Map<string, number>();
    let repeatHits = 0;

    const ac = new AbortController();
    abortRef.current = ac;
    try {
      while (moves < pliesLimit) {
        // Count current position repetition before thinking
        try {
          const kNow = computeKey(state);
          const keyStrNow = `${(kNow.hi >>> 0)}:${(kNow.lo >>> 0)}`;
          const c = (repCounts.get(keyStrNow) ?? 0) + 1;
          repCounts.set(keyStrNow, c);
          if (c === repeatMax) repeatHits++;
        } catch {}
        setMoveIndex(moves + 1);
        startProgress(timeMs);
        const res = await computeBestMoveAsync(state, {
          depth,
          timeMs,
          workers: 'auto',
          signal: ac.signal,
        });
        stopProgress();
        totalThinkMs += res.elapsedMs || 0;
        try {
          const k = computeKey(state);
          const sig = res.move ? makeSignature(res.move as AIMove) : undefined;
          perMove.push({
            elapsedMs: res.elapsedMs,
            depthReached: res.depthReached,
            nodes: res.nodes,
            nps: res.nps,
            score: res.score,
            keyHi: (k.hi >>> 0),
            keyLo: (k.lo >>> 0),
            moveSig: sig,
          });
        } catch {
          perMove.push({ elapsedMs: res.elapsedMs, depthReached: res.depthReached, nodes: res.nodes, nps: res.nps, score: res.score });
        }
        if (!res.move) break;
        state = applyMove(state, res.move as AIMove);
        moves++;
        const over = isGameOver(state);
        if (over.over) {
          const avgThinkMs = moves > 0 ? totalThinkMs / moves : 0;
          return {
            id,
            createdAt,
            version: 'pylos-infoia-v1',
            depth,
            timeMode,
            timeSeconds: timeMode === 'manual' ? timeSeconds : undefined,
            pliesLimit,
            moves,
            avgThinkMs,
            totalThinkMs,
            winner: over.winner ?? null,
            endedReason: over.reason,
            repeatMax,
            repeatHits,
            perMove,
          };
        }
      }
    } finally {
      abortRef.current = null;
      stopProgress();
    }

    const over = isGameOver(state);
    const avgThinkMs = moves > 0 ? totalThinkMs / moves : 0;
    return {
      id,
      createdAt,
      version: 'pylos-infoia-v1',
      depth,
      timeMode,
      timeSeconds: timeMode === 'manual' ? timeSeconds : undefined,
      pliesLimit,
      moves,
      avgThinkMs,
      totalThinkMs,
      winner: over.winner ?? null,
      endedReason: over.reason,
      repeatMax,
      repeatHits,
      perMove,
    };
  }, [depth, pliesLimit, timeMode, timeMs, timeSeconds]);

  const onStart = useCallback(async () => {
    if (running) return;
    setRunning(true);
    try {
      for (let i = 0; i < gamesCount; i++) {
        const rec = await runOneGame();
        await dbSave(rec);
        setRecords((prev) => [rec, ...prev]);
      }
    } catch (e) {
      // Swallow AbortError silently
    } finally {
      setRunning(false);
    }
  }, [gamesCount, runOneGame, running]);

  const onStop = useCallback(() => {
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    setRunning(false);
    stopProgress();
  }, []);

  useEffect(() => {
    return () => {
      stopProgress();
    };
  }, [stopProgress]);

  const onExportJSON = useCallback(() => {
    const current = activeTableSourceId === 'local'
      ? records
      : (compareSets.find((s) => s.id === activeTableSourceId)?.records || records);
    const blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_ia_partidas_${buildExportTimestampName()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeTableSourceId, compareSets, records]);

  // Export aggregated opening book from stored records (uses per-move key/moveSig)
  const onExportBook = useCallback(() => {
    const current = activeTableSourceId === 'local'
      ? records
      : (compareSets.find((s) => s.id === activeTableSourceId)?.records || records);
    // Map key ("hi:lo") -> Map(moveSig -> count)
    const freq = new Map<string, Map<number, number>>();
    const parseKey = (hi?: number, lo?: number): string | null => {
      if (typeof hi !== 'number' || typeof lo !== 'number') return null;
      return `${hi >>> 0}:${lo >>> 0}`;
    };
    for (const rec of current) {
      for (const pm of rec.perMove || []) {
        const keyStr = parseKey(pm.keyHi, pm.keyLo);
        if (!keyStr) continue;
        if (typeof pm.moveSig !== 'number') continue;
        let m = freq.get(keyStr);
        if (!m) { m = new Map<number, number>(); freq.set(keyStr, m); }
        m.set(pm.moveSig >>> 0, (m.get(pm.moveSig >>> 0) ?? 0) + 1);
      }
    }
    type BookEntry = { keyHi: number; keyLo: number; bestMove: number };
    const entries: BookEntry[] = [];
    for (const [keyStr, m] of freq.entries()) {
      // choose moveSig with highest count
      let bestSig = 0;
      let bestCnt = -1;
      for (const [sig, cnt] of m.entries()) {
        if (cnt > bestCnt) { bestCnt = cnt; bestSig = sig >>> 0; }
      }
      const [hiStr, loStr] = keyStr.split(':');
      const keyHi = Number(hiStr) >>> 0;
      const keyLo = Number(loStr) >>> 0;
      if (bestCnt > 0) entries.push({ keyHi, keyLo, bestMove: bestSig });
    }
    // Build file
    const book = { version: new Date().toISOString(), entries };
    const blob = new Blob([JSON.stringify(book, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `book_${buildExportTimestampName()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeTableSourceId, compareSets, records]);

  const onExportCSV = useCallback(() => {
    const current = activeTableSourceId === 'local'
      ? records
      : (compareSets.find((s) => s.id === activeTableSourceId)?.records || records);
    const rows = current.map((r) => ({
      id: r.id,
      createdAt: fmtDate(r.createdAt),
      depth: r.depth,
      timeMode: r.timeMode,
      timeSeconds: r.timeSeconds ?? '',
      pliesLimit: r.pliesLimit,
      moves: r.moves,
      avgThinkMs: Math.round(r.avgThinkMs),
      totalThinkMs: Math.round(r.totalThinkMs),
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
  }, [activeTableSourceId, compareSets, records]);

  // Remove old JSON-to-DB import; we reuse compare loader for both tabs

  const onDelete = useCallback(async (id: string) => {
    await dbDelete(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const onClearAll = useCallback(async () => {
    await dbClear();
    setRecords([]);
  }, []);

  // Aggregates for charts (group by dificultad/depth)
  type AggRow = { depth: number; avgSec: number; minSec: number; maxSec: number };
  const computeAggregates = useCallback((list: InfoIAGameRecord[]): AggRow[] => {
    const map = new Map<number, { count: number; sumAvg: number; min: number; max: number }>();
    for (const r of list) {
      const d = r.depth;
      const recAvg = (r.avgThinkMs ?? 0) / 1000;
      // Compute per-record min/max over moves
      let recMin = Number.POSITIVE_INFINITY;
      let recMax = 0;
      for (const pm of r.perMove || []) {
        const v = (pm.elapsedMs ?? 0) / 1000;
        if (v < recMin) recMin = v;
        if (v > recMax) recMax = v;
      }
      if (!isFinite(recMin)) recMin = 0;
      const prev = map.get(d) ?? { count: 0, sumAvg: 0, min: Number.POSITIVE_INFINITY, max: 0 };
      prev.count += 1;
      prev.sumAvg += recAvg;
      if (recMin < prev.min) prev.min = recMin;
      if (recMax > prev.max) prev.max = recMax;
      map.set(d, prev);
    }
    const out: AggRow[] = [];
    for (const [d, v] of map.entries()) {
      const avgSec = v.count > 0 ? v.sumAvg / v.count : 0;
      const minSec = isFinite(v.min) ? v.min : 0;
      const maxSec = v.max;
      out.push({ depth: d, avgSec, minSec, maxSec });
    }
    out.sort((a, b) => a.depth - b.depth);
    return out;
  }, []);
  // Note: we compute aggregates per-dataset in the charts section directly

  // Colors for comparison datasets (distinct hues)
  const datasetColors = useMemo<string[]>(() => [
    '#60a5fa', // blue-400
    '#f472b6', // pink-400
    '#34d399', // emerald-400
    '#a78bfa', // violet-400
    '#f59e0b', // amber-500
    '#22d3ee', // cyan-400
    '#fb7185', // rose-400
    '#fbbf24', // amber-400
  ], []);

  // Parse helpers for comparison imports
  const parseCsvToRecords = useCallback((text: string): InfoIAGameRecord[] => {
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

    // Split respecting quotes
    const splitCsvLine = (line: string): string[] => {
      const cols: string[] = [];
      let buf = '';
      let q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (q && line[i + 1] === '"') { buf += '"'; i++; } else { q = !q; }
        } else if (c === DELIM && !q) {
          cols.push(buf); buf = '';
        } else {
          buf += c;
        }
      }
      cols.push(buf);
      // Unquote and trim
      for (let i = 0; i < cols.length; i++) {
        let v = cols[i];
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
        cols[i] = v.trim();
      }
      return cols;
    };

    const headerRaw = splitCsvLine(lines[0]);
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
      const cols = splitCsvLine(lines[r]);
      if (cols.length === 0) continue;
      const idText = get(cols, 'id');
      const id = (idText && idText.length > 0 ? idText : makeId()).trim();
      const createdAtStr = get(cols, 'createdAt');
      const createdAt = Date.parse(createdAtStr) || Date.now();
      const depth = parseNum(get(cols, 'depth'));
      const timeModeTxt = get(cols, 'timeMode');
      const timeMode = (timeModeTxt === 'auto' ? 'auto' : 'manual') as TimeMode;
      const timeSecondsVal = parseNum(get(cols, 'timeSeconds'));
      const timeSeconds = timeMode === 'manual' && timeSecondsVal > 0 ? timeSecondsVal : undefined;
      const pliesLimit = parseNum(get(cols, 'pliesLimit'));
      const moves = parseNum(get(cols, 'moves'));
      const avgThinkMs = parseNum(get(cols, 'avgThinkMs'));
      const totalThinkMs = parseNum(get(cols, 'totalThinkMs'));
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
        winner,
        endedReason,
        repeatMax: parseNumOrUndef(get(cols, 'repeatMax')),
        repeatHits: parseNumOrUndef(get(cols, 'repeatHits')),
        perMove: [],
      });
    }
    return out;
  }, []);

  const parseJsonToRecords = useCallback((text: string): InfoIAGameRecord[] => {
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
  }, []);

  const pickDatasetColor = useCallback((idx: number) => datasetColors[idx % datasetColors.length], [datasetColors]);
  const onAddCompareClick = () => compareInputRef.current?.click();
  const onCompareFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
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
            id: makeId(),
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
    if (compareInputRef.current) compareInputRef.current.value = '';
  }, [compareSets.length, parseCsvToRecords, parseJsonToRecords, pickDatasetColor]);

  const onRemoveCompare = useCallback((id: string) => {
    setCompareSets((prev) => prev.filter((s) => s.id !== id));
    setActiveTableSourceId((prev) => (prev === id ? 'local' : prev));
  }, []);
  const onClearCompare = useCallback(() => {
    setCompareSets([]);
    setActiveTableSourceId('local');
    if (compareInputRef.current) compareInputRef.current.value = '';
  }, []);

  // chartDims removed: new comparative chart computes layout per render

  return (
    <section className="panel infoia-panel" aria-label="InfoIA (simulaciones de IA)">
      <div className="infoia__header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h3 className="ia-panel__title" style={{ marginRight: 'auto' }}>InfoIA</h3>
        <div className="infoia__tabs segmented" role="tablist" aria-label="Secciones de InfoIA">
          <button
            className={activeTab === 'sim' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'sim'}
            onClick={() => setActiveTab('sim')}
            title="Ver simulaciones y métricas"
          >
            Simulaciones y Métricas
          </button>
          <button
            className={activeTab === 'charts' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'charts'}
            onClick={() => setActiveTab('charts')}
            title="Ver gráficos"
          >
            Gráficos
          </button>
        </div>
        <div className="infoia__status" aria-live="polite">
          {running && (
            <span className="kpi kpi--accent" title="Ejecución en curso">
              <span className="spinner" aria-hidden="true" />
              Ejecutando…
            </span>
          )}
        </div>
      </div>
      {/* Shared hidden input for CSV/JSON across both tabs */}
      <input
        ref={compareInputRef}
        type="file"
        accept=".json,application/json,.csv,text/csv"
        multiple
        onChange={onCompareFiles}
        style={{ display: 'none' }}
      />

      {activeTab === 'sim' && (
        <>
          <div className="row infoia__controls" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="label" htmlFor="infoia-depth">Dificultad</label>
            <select id="infoia-depth" value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
              {[1,2,3,4,5,6,7,8,9,10].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Selector de tabla: Local o archivos agregados */}
            <label className="label">Tabla</label>
            <div className="segmented" role="tablist" aria-label="Seleccionar dataset para la tabla">
              <button
                className={activeTableSourceId === 'local' ? 'active' : ''}
                role="tab"
                aria-selected={activeTableSourceId === 'local'}
                onClick={() => setActiveTableSourceId('local')}
                title="Mostrar datos locales"
              >Local</button>
              {compareSets.map((s) => (
                <button
                  key={s.id}
                  className={activeTableSourceId === s.id ? 'active' : ''}
                  role="tab"
                  aria-selected={activeTableSourceId === s.id}
                  onClick={() => setActiveTableSourceId(s.id)}
                  title={s.name}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
                  <span className="ellipsis" style={{ maxWidth: 160 }}>{s.name}</span>
                </button>
              ))}
            </div>
 
            <label className="label">Tiempo</label>
            <div className="segmented" role="group" aria-label="Modo de tiempo de simulación">
              <button className={timeMode === 'auto' ? 'active' : ''} onClick={() => setTimeMode('auto')} aria-pressed={timeMode === 'auto'}>Auto</button>
              <button className={timeMode === 'manual' ? 'active' : ''} onClick={() => setTimeMode('manual')} aria-pressed={timeMode === 'manual'}>Manual</button>
            </div>
            {timeMode === 'manual' && (
              <div className="ia-panel__range" aria-label="Selector de tiempo manual">
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={0.5}
                  value={timeSeconds}
                  onChange={(e) => setTimeSeconds(Number(e.target.value))}
                  aria-valuemin={0}
                  aria-valuemax={30}
                  aria-valuenow={timeSeconds}
                />
                <span className="range-value badge">{timeSeconds.toFixed(1)} s</span>
              </div>
            )}
 
            <label className="label" htmlFor="infoia-plies">Límite jugadas</label>
            <input id="infoia-plies" className="field-num" type="number" min={1} max={400} value={pliesLimit} onChange={(e) => setPliesLimit(Number(e.target.value))} style={{ width: 90 }} />
 
            <label className="label" htmlFor="infoia-count">Partidas</label>
            <input id="infoia-count" className="field-num" type="number" min={1} max={1000} value={gamesCount} onChange={(e) => setGamesCount(Number(e.target.value))} style={{ width: 90 }} />
 
            <div className="infoia__actions" style={{ display: 'inline-flex', gap: 8, marginLeft: 'auto' }}>
              {!running ? (
                <button className="primary" onClick={onStart} disabled={loading} title="Iniciar simulaciones">Iniciar</button>
              ) : (
                <button className="btn-stop" onClick={onStop} title="Detener simulación en curso">Detener</button>
              )}
              <button className="btn-ghost" onClick={onExportJSON}>Exportar JSON</button>
              <button className="btn-ghost" onClick={onExportCSV}>Exportar CSV</button>
              <button className="btn-ghost" onClick={onExportBook} title="Generar libro de aperturas (book.json) a partir de las simulaciones">Exportar Book</button>
              <button className="btn-ghost" onClick={onAddCompareClick} title="Agregar CSV o JSON">Agregar CSV o JSON</button>
              <button className="btn-danger" onClick={onClearAll} disabled={activeTableSourceId !== 'local' || records.length === 0} title={activeTableSourceId !== 'local' ? 'Solo disponible para datos locales' : 'Borrar todos los registros locales'}>Borrar todo</button>
            </div>
          </div>
 
          {/* Per-move time progress */}
          {running && (
            <div className="ia-panel__timebar" role="status" aria-live="polite">
              <div
                className="timebar"
                data-busy={true}
                data-over={!!moveTargetMs && moveElapsedMs >= moveTargetMs}
                data-auto={moveTargetMs == null}
              >
                <div
                  className="timebar__fill"
                  style={moveTargetMs != null ? { width: `${Math.min(100, (moveElapsedMs / moveTargetMs) * 100).toFixed(2)}%` } : undefined}
                />
              </div>
              <div className="timebar__meta">
                <span>Jugada #{moveIndex}</span>
                <span>
                  {`${(moveElapsedMs / 1000).toFixed(3)} s`}
                  {moveTargetMs != null ? ` / ${(moveTargetMs / 1000).toFixed(3)} s` : ' (Auto)'}
                </span>
              </div>
            </div>
          )}
 
          {(() => {
            const activeDs = activeTableSourceId === 'local' ? null : compareSets.find((s) => s.id === activeTableSourceId) || null;
            const tableRecs = activeDs ? activeDs.records : records;
            const sorted = [...tableRecs].sort((a, b) => b.createdAt - a.createdAt);
            const isLoading = activeDs ? false : loading;
            return (
          <div className="infoia__table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th className="text-center">Dificultad</th>
                  <th className="text-center">Tiempo</th>
                  <th className="text-right">Jugadas</th>
                  <th className="text-right">Promedio (s)</th>
                  <th className="text-right">Mín (s)</th>
                  <th className="text-right">Máx (s)</th>
                  <th className="text-right">Total (s)</th>
                  <th className="text-center">Ganador</th>
                  <th>Motivo</th>
                  <th className="text-right" title="Veces que se alcanzó el umbral de repetición en la partida">Reps ≥max</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={13}>Cargando…</td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={13}>Sin registros aún</td></tr>
                ) : (
                  sorted.map((r) => (
                    <tr key={r.id}>
                      <td title={r.id} className="mono ellipsis">{r.id}</td>
                      <td>{fmtDate(r.createdAt)}</td>
                      <td className="text-center">{r.depth}</td>
                      <td className="text-center">
                        <span className="badge">
                          {r.timeMode === 'auto' ? 'Auto (∞)' : `${((r.timeSeconds ?? 0)).toFixed(3)} s`}
                        </span>
                      </td>
                      <td className="text-right">{r.moves}</td>
                      <td className="text-right">{(r.avgThinkMs / 1000).toFixed(3)}</td>
                      <td className="text-right">{
                        (() => {
                          const times = (r.perMove || []).map(pm => pm.elapsedMs || 0);
                          if (times.length === 0) return (0).toFixed(3);
                          let min = times[0];
                          for (let i = 1; i < times.length; i++) if (times[i] < min) min = times[i];
                          return (min / 1000).toFixed(3);
                        })()
                      }</td>
                      <td className="text-right">{
                        (() => {
                          const times = (r.perMove || []).map(pm => pm.elapsedMs || 0);
                          if (times.length === 0) return (0).toFixed(3);
                          let max = times[0];
                          for (let i = 1; i < times.length; i++) if (times[i] > max) max = times[i];
                          return (max / 1000).toFixed(3);
                        })()
                      }</td>
                      <td className="text-right">{(r.totalThinkMs / 1000).toFixed(3)}</td>
                      <td className="text-center">
                        {r.winner ? (
                          <span className={"badge " + (r.winner === 'L' ? 'badge--light' : 'badge--dark')}>{r.winner}</span>
                        ) : '—'}
                      </td>
                      <td className="ellipsis motivo-cell" title={r.endedReason ?? '-' }>{r.endedReason ?? '—'}</td>
                      <td className="text-right" title={typeof r.repeatMax === 'number' ? `max=${r.repeatMax}` : 'sin dato'}>{
                        (typeof r.repeatHits === 'number' ? r.repeatHits : '---')
                      }</td>
                      <td className="text-center">
                        <button className="chip-btn"
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `pylos-infoia-${r.id}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          title="Descargar JSON"
                        >Descargar</button>
                        {activeDs == null && (
                          <button className="chip-btn btn-danger" onClick={() => onDelete(r.id)} title="Eliminar">Eliminar</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
            );
          })()}
        </>
      )}

      {activeTab === 'charts' && (
        <div className="infoia__charts" style={{ paddingTop: 8 }}>
          {/* Controls for comparison datasets */}
          <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <button className="btn-ghost" onClick={onAddCompareClick} title="Agregar CSV o JSON para comparar">Agregar CSV o JSON para comparar</button>
            <input
              ref={compareInputRef}
              type="file"
              accept=".json,application/json,.csv,text/csv"
              multiple
              onChange={onCompareFiles}
              style={{ display: 'none' }}
            />
            {compareSets.map((s) => (
              <span key={s.id} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0b1220', border: '1px solid #1f2937', padding: '4px 8px', borderRadius: 999 }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 999, background: s.color }} />
                <span className="mono" title={s.name} style={{ maxWidth: 260 }}>
                  {s.name}
                </span>
                <button className="chip-btn btn-danger" onClick={() => onRemoveCompare(s.id)} title="Quitar">✕</button>
              </span>
            ))}
            {compareSets.length > 0 && (
              <button className="btn-ghost" onClick={onClearCompare} title="Quitar todas las comparaciones">Limpiar</button>
            )}
          </div>

          {(() => {
            const local = { id: 'local', name: 'Local', color: '#22c55e', records };
            const datasets = [local, ...compareSets];
            // Build aggregates per dataset
            const dsAgg = datasets.map((ds) => ({ ...ds, aggregates: computeAggregates(ds.records) }));
            const emptyAgg = dsAgg.filter(d => d.aggregates.length === 0 && d.records.length > 0);
            if (emptyAgg.length > 0) {
              // Helpful console warning for diagnosis when CSV parsed but headers mismatched
              // eslint-disable-next-line no-console
              console.warn('[InfoIA] Algunos datasets no generaron agregados (revisa columnas esperadas: id, createdAt, depth, timeMode, timeSeconds, pliesLimit, moves, avgThinkMs, totalThinkMs, winner, endedReason):', emptyAgg.map(e => e.name));
            }
            const hasAnyAgg = dsAgg.some((d) => d.aggregates.length > 0);
            if (!hasAnyAgg) {
              return <p style={{ opacity: 0.8 }}>Sin datos todavía. Ejecuta simulaciones o agrega archivos para comparar.</p>;
            }

            // Build union of depths
            const depthSet = new Set<number>();
            for (const d of dsAgg) for (const a of d.aggregates) depthSet.add(a.depth);
            const depths = Array.from(depthSet).sort((a, b) => a - b);

            // Chart dimensions and Y scale considering all datasets
            const width = chartW || 980;
            const height = chartH || 460;
            // Adaptive margins and typography
            const isSmall = width < 560;
            const isMid = !isSmall && width < 860;
            const margin = isSmall
              ? { top: 62, right: 20, bottom: 52, left: 66 }
              : isMid
              ? { top: 68, right: 26, bottom: 58, left: 80 }
              : { top: 72, right: 32, bottom: 64, left: 90 };
            const innerW = width - margin.left - margin.right;
            const innerH = height - margin.top - margin.bottom;
            let maxY = 1;
            for (const d of dsAgg) {
              for (const a of d.aggregates) {
                maxY = Math.max(maxY, a.avgSec, a.minSec, a.maxSec);
              }
            }
            const targetTicks = 5;
            const niceStep = (rawMax: number, target: number) => {
              if (!(rawMax > 0)) return 1;
              const raw = rawMax / target;
              const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
              const candidates = [1, 2, 2.5, 5, 10].map((m) => m * pow10);
              for (const c of candidates) if (raw <= c) return c;
              return 10 * pow10;
            };
            const step = niceStep(maxY, targetTicks);
            const niceMaxY = Math.ceil(maxY / step) * step;
            const ticksY: number[] = [];
            for (let y = 0; y <= niceMaxY + 1e-9; y += step) ticksY.push(Number(y.toFixed(6)));

            const idxOfDepth = (d: number) => depths.indexOf(d);
            const xForIndex = (i: number) => margin.left + (depths.length <= 1 ? innerW / 2 : (i * innerW) / (depths.length - 1));
            const yScale = (s: number) => height - margin.bottom - innerH * (s / (niceMaxY || 1));

            // Typography scaling
            const fsAxis = isSmall ? 10 : isMid ? 11 : 12;
            const fsLegend = isSmall ? 10 : 12;

            // Build path segments for a dataset and metric key
            const pathFor = (aggs: AggRow[], key: keyof AggRow) => {
              const points: Array<{ x: number; y: number }> = [];
              for (const a of aggs) {
                const idx = idxOfDepth(a.depth);
                if (idx < 0) continue;
                const val = a[key] as number;
                const x = xForIndex(idx);
                const y = yScale(val);
                points.push({ x, y });
              }
              if (points.length === 0) return '';
              // Build continuous path (no gaps assumed if missing depths)
              let d = `M${points[0].x},${points[0].y}`;
              for (let i = 1; i < points.length; i++) d += ` L${points[i].x},${points[i].y}`;
              return d;
            };

            return (
              <div ref={chartBoxRef} className="infoia__chart-container">
                {width > 0 && height > 0 && (
                  <svg width={width} height={height} role="img" aria-label="Gráfico comparativo de métricas por dificultad">
                <defs>
                  {/* Soft shadow for lines/points */}
                  <filter id="ds" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                    <feOffset dy="1" result="offset" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.25" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode in="offset" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Legend: wrapped across rows for small widths */}
                {(() => {
                  const itemW = 200; // logical width per legend sample
                  const cols = Math.max(1, Math.floor(innerW / itemW));
                  const rows = Math.max(1, Math.ceil(dsAgg.length / cols));
                  const legendY = margin.top - 20 - (rows - 1) * 18;
                  return (
                    <g transform={`translate(${margin.left}, ${legendY})`} aria-hidden="false">
                      {dsAgg.map((ds, i) => {
                        const col = i % cols;
                        const row = Math.floor(i / cols);
                        const x = (innerW / cols) * col;
                        const y = row * 18;
                        return (
                          <g key={ds.id || ds.name} transform={`translate(${x}, ${y})`}>
                      {/* Avg (solid) */}
                      <line x1={0} y1={-6} x2={36} y2={-6} stroke={ds.color} strokeWidth={3} />
                      {/* Min (dashed) */}
                      <line x1={0} y1={2} x2={36} y2={2} stroke={ds.color} strokeWidth={2} strokeDasharray="6,4" opacity={0.9} />
                      {/* Max (dotted) */}
                      <line x1={0} y1={10} x2={36} y2={10} stroke={ds.color} strokeWidth={2} strokeDasharray="2,5" opacity={0.9} />
                          <text x={48} y={2} alignmentBaseline="middle" className="mono" fontSize={fsLegend} fill="#e5e7eb">{ds.name}</text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}

                {/* Horizontal grid and Y axis */}
                <g aria-hidden="true">
                  {ticksY.map((t, i) => (
                    <g key={i}>
                      <line x1={margin.left} y1={yScale(t)} x2={width - margin.right} y2={yScale(t)} stroke="#334155" strokeDasharray="2,4" />
                      <text x={margin.left - 8} y={yScale(t) + 4} textAnchor="end" fontSize={fsAxis} fill="#ffffff">{t % 1 === 0 ? `${t}s` : `${t.toFixed(1)}s`}</text>
                    </g>
                  ))}
                  {/* Y axis label */}
                  <text transform={`translate(${margin.left - 52}, ${margin.top + innerH / 2}) rotate(-90)`} textAnchor="middle" fontSize={fsLegend} opacity={0.9} fill="#ffffff">Segundos (s)</text>
                </g>

                {/* Vertical guides and X axis */}
                <g aria-hidden="true">
                  {depths.map((d, i) => (
                    <g key={d} transform={`translate(${xForIndex(i)}, 0)`}>
                      <line y1={margin.top} y2={height - margin.bottom} stroke="#1f2937" strokeOpacity={0.25} />
                      <line y1={height - margin.bottom} y2={height - margin.bottom + 6} stroke="#64748b" />
                      <text y={height - margin.bottom + 18} textAnchor="middle" fontSize={fsAxis} fill="#ffffff">Dificultad {d}</text>
                    </g>
                  ))}
                  {/* X axis label */}
                  <text x={width - margin.right} y={height - 8} textAnchor="end" fontSize={fsLegend} opacity={0.9} fill="#ffffff">Dificultad</text>
                </g>

                {/* Dataset lines */}
                {dsAgg.map((ds) => (
                  <g key={ds.id || ds.name}>
                    {/* Avg (solid) */}
                    <path d={pathFor(ds.aggregates, 'avgSec')} fill="none" stroke={ds.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} filter="url(#ds)" />
                    {/* Min (dashed) */}
                    {ds.aggregates.some(a => a.minSec > 0) && (
                      <path d={pathFor(ds.aggregates, 'minSec')} fill="none" stroke={ds.color} strokeWidth={2} strokeDasharray="6,4" opacity={0.9} />
                    )}
                    {/* Max (dotted) */}
                    {ds.aggregates.some(a => a.maxSec > 0) && (
                      <path d={pathFor(ds.aggregates, 'maxSec')} fill="none" stroke={ds.color} strokeWidth={2} strokeDasharray="2,5" opacity={0.9} />
                    )}
                  </g>
                ))}

                {/* Points */}
                {dsAgg.map((ds) => (
                  <g key={(ds.id || ds.name) + '-pts'}>
                    {ds.aggregates.map((a) => {
                      const i = idxOfDepth(a.depth);
                      const cx = xForIndex(i);
                      const pts = [
                        { key: 'avgSec' as const, val: a.avgSec, r: 5, strokeW: 1.2 },
                        ...(a.minSec > 0 ? [{ key: 'minSec' as const, val: a.minSec, r: 4, strokeW: 1.0 }] : []),
                        ...(a.maxSec > 0 ? [{ key: 'maxSec' as const, val: a.maxSec, r: 4, strokeW: 1.0 }] : []),
                      ];
                      return (
                        <g key={`d${a.depth}`}> 
                          {pts.map((p) => {
                            const cy = yScale(p.val);
                            return (
                              <g key={p.key} filter="url(#ds)">
                                <circle cx={cx} cy={cy} r={p.r} fill={ds.color} stroke="#0b1220" strokeWidth={p.strokeW} />
                                <circle cx={cx} cy={cy} r={p.r + 2} fill="none" stroke={ds.color} strokeOpacity={0.25} />
                                <title>{`${ds.name} · ${p.key === 'avgSec' ? 'Promedio' : p.key === 'minSec' ? 'Mín' : 'Máx'}: ${p.val.toFixed(3)}s @ Dificultad ${a.depth}`}</title>
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}
                  </g>
                ))}
                  </svg>
                )}
              </div>
            );
          })()}
          {(() => {
            const local = { id: 'local', name: 'Local', color: '#22c55e', records };
            const dsAgg = [local, ...compareSets].map((ds) => ({ ...ds, aggregates: computeAggregates(ds.records) }));
            const empties = dsAgg.filter(d => d.aggregates.length === 0 && d.records.length > 0 && d.name !== 'Local');
            if (empties.length === 0) return null;
            return (
              <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                Nota: algunos archivos no aportaron datos al gráfico (campos faltantes o valores inválidos): {empties.map(e => e.name).join(', ')}
              </p>
            );
          })()}
        </div>
      )}
    </section>
  );
}

