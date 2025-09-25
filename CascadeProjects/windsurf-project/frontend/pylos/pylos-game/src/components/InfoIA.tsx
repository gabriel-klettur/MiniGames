import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { initialState, isGameOver } from '../game/rules';
import { applyMove } from '../ia/moves';
import { computeBestMoveAsync } from '../ia';
import type { AIMove } from '../ia/moves';
import { dbClear, dbDelete, dbGetAll, dbSave, makeId } from '../utils/infoiaDb';
import type { InfoIAGameRecord } from '../utils/infoiaDb';

type TimeMode = 'auto' | 'manual';

function fmtDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
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

  // Controls
  const [depth, setDepth] = useState<number>(3);
  const [timeMode, setTimeMode] = useState<TimeMode>('manual');
  const [timeSeconds, setTimeSeconds] = useState<number>(8);
  const [pliesLimit, setPliesLimit] = useState<number>(80);
  const [gamesCount, setGamesCount] = useState<number>(5);

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
    const perMove: { elapsedMs: number; depthReached?: number; nodes?: number; nps?: number; score?: number }[] = [];

    const ac = new AbortController();
    abortRef.current = ac;
    try {
      while (moves < pliesLimit) {
        setMoveIndex(moves + 1);
        startProgress(timeMs);
        const res = await computeBestMoveAsync(state, {
          depth,
          timeMs,
          signal: ac.signal,
        });
        stopProgress();
        totalThinkMs += res.elapsedMs || 0;
        perMove.push({ elapsedMs: res.elapsedMs, depthReached: res.depthReached, nodes: res.nodes, nps: res.nps, score: res.score });
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
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pylos-infoia-sims.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [records]);

  const onExportCSV = useCallback(() => {
    const rows = records.map((r) => ({
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
    }));
    const csv = toCsv(rows as any);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pylos-infoia-sims.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [records]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onImportClick = () => fileInputRef.current?.click();
  const onImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const list: InfoIAGameRecord[] = Array.isArray(data) ? data : [data];
      for (const rec of list) {
        // naive validation
        if (!rec || typeof rec !== 'object') continue;
        if ((rec as any).version !== 'pylos-infoia-v1') continue;
        if (!(rec as any).id) (rec as any).id = makeId();
        await dbSave(rec as InfoIAGameRecord);
      }
      await refresh();
    } catch (err) {
      console.error('Import error', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [refresh]);

  const onDelete = useCallback(async (id: string) => {
    await dbDelete(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const onClearAll = useCallback(async () => {
    await dbClear();
    setRecords([]);
  }, []);

  return (
    <section className="panel infoia-panel" aria-label="InfoIA (simulaciones de IA)">
      <div className="infoia__header">
        <h3 className="ia-panel__title">InfoIA — Simulaciones y Métricas</h3>
        <div className="infoia__status" aria-live="polite">
          {running && (
            <span className="kpi kpi--accent" title="Ejecución en curso">
              <span className="spinner" aria-hidden="true" />
              Ejecutando…
            </span>
          )}
        </div>
      </div>

      <div className="row infoia__controls" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="label" htmlFor="infoia-depth">Dificultad</label>
        <select id="infoia-depth" value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
          {[1,2,3,4,5,6,7,8,9,10].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

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
          <button className="btn-ghost" onClick={onExportJSON} disabled={records.length === 0}>Exportar JSON</button>
          <button className="btn-ghost" onClick={onExportCSV} disabled={records.length === 0}>Exportar CSV</button>
          <button className="btn-ghost" onClick={onImportClick}>Importar…</button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={onImportFile} style={{ display: 'none' }} />
          <button className="btn-danger" onClick={onClearAll} disabled={records.length === 0}>Borrar todo</button>
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

      <div className="infoia__table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th className="text-center">Dificultad</th>
              <th className="text-center">Tiempo</th>
              <th className="text-right">Jugadas</th>
              <th className="text-right">Promedio por jugada (s)</th>
              <th className="text-right">Mín (s)</th>
              <th className="text-right">Máx (s)</th>
              <th className="text-right">Total de todas las jugadas (s)</th>
              <th className="text-center">Ganador</th>
              <th>Motivo</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12}>Cargando…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={12}>Sin registros aún</td></tr>
            ) : (
              records.map((r) => (
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
                    <button className="chip-btn btn-danger" onClick={() => onDelete(r.id)} title="Eliminar">Eliminar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

