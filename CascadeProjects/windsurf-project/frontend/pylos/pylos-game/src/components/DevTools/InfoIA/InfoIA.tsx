import { useCallback, useEffect, useRef, useState } from 'react';
import type { InfoIAGameRecord } from '../../../utils/infoiaDb';
import type { GameState } from '../../../game/types';

// date utils used inside hooks
import TablaIA from './views/TablaIA';
import ChartContainer from './views/Chart/ChartContainer';
import TimeBar from './views/TimeBar';
import CompareBar from './views/CompareBar';
import Controls from './views/Controls/Controls';
import Books from './views/Books';
import { getAllRecords, saveRecord, deleteRecord, clearAllRecords } from './services/storage';
// parse helpers moved to hooks/useCompareDatasets
import { useCompareDatasets } from './hooks/useCompareDatasets';
import { useExports } from './hooks/useExports';
import { publishAllBooksToDevServer, clearBooksOnDevServer } from './services/publishBooks';
import { useInfoIASim } from './hooks/useInfoIASim';
import type { TimeMode } from './types';

// buildExportTimestampName moved to utils/date

export type InfoIAProps = {
  onMirrorStart?: () => void;
  onMirrorUpdate?: (s: GameState) => void;
  onMirrorEnd?: (s: GameState) => void;
};

export default function InfoIA(props: InfoIAProps) {
  const [records, setRecords] = useState<InfoIAGameRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<null | { message: string; kind: 'success' | 'error' | 'info' }>(null);
  const toastTimerRef = useRef<number | null>(null);
  const showToast = (message: string, kind: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimerRef.current != null) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ message, kind });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 5400);
  };
  
  // Comparison datasets for Charts/Tabla
  const { compareSets, activeTableSourceId, setActiveTableSourceId, addFilesFromFileList, removeSet, clearSets } = useCompareDatasets();
  const compareInputRef = useRef<HTMLInputElement | null>(null);
  // Chart sizing handled inside views/Chart with a hook

  // Controls
  const [depth, setDepth] = useState<number>(3);
  const [timeMode, setTimeMode] = useState<TimeMode>('auto');
  const [timeSeconds, setTimeSeconds] = useState<number>(8);
  const [pliesLimit, setPliesLimit] = useState<number>(80);
  const [gamesCount, setGamesCount] = useState<number>(10);
  // Mirror simulation on main board (fast, no animations)
  const [mirrorBoard, setMirrorBoard] = useState<boolean>(true);
  // Use opening books during simulations
  const [useBook, setUseBook] = useState<boolean>(false);

  // Persist controls locally so defaults apply only when no saved prefs exist
  const STORAGE_KEY = 'pylos.infoia.controls.v1';
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return; // keep defaults
      const p = JSON.parse(raw);
      if (Number.isFinite(p?.depth)) setDepth(Math.max(1, Math.min(10, Math.floor(p.depth))));
      if (p?.timeMode === 'auto' || p?.timeMode === 'manual') setTimeMode(p.timeMode);
      if (Number.isFinite(p?.timeSeconds)) setTimeSeconds(Math.max(0, Math.min(30, Number(p.timeSeconds))));
      if (Number.isFinite(p?.pliesLimit)) setPliesLimit(Math.max(1, Math.min(400, Math.floor(p.pliesLimit))));
      if (Number.isFinite(p?.gamesCount)) setGamesCount(Math.max(1, Math.min(1000, Math.floor(p.gamesCount))));
      if (typeof p?.mirrorBoard === 'boolean') setMirrorBoard(p.mirrorBoard);
      // Por petición: 'Utilizar books' deshabilitado por defecto y no se reactiva con preferencias anteriores
      // No leemos 'useBook' desde localStorage; permanece en su valor por defecto (false)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const payload = { depth, timeMode, timeSeconds, pliesLimit, gamesCount, mirrorBoard, useBook };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [depth, timeMode, timeSeconds, pliesLimit, gamesCount, mirrorBoard, useBook]);
 
  // Tabs UI: 'sim' para Simulaciones y Métricas, 'charts' para Gráficos, 'books' para gestión/visualización de books
  const [activeTab, setActiveTab] = useState<'sim' | 'charts' | 'books'>('sim');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllRecords();
      setRecords(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  // Chart resize effect moved to views/Chart via useChartResize

  const { running, start, stop, moveIndex, moveElapsedMs, moveTargetMs } = useInfoIASim({
    depth,
    timeMode,
    timeSeconds,
    pliesLimit,
    gamesCount,
    mirrorBoard,
    useBook,
    onMirrorStart: props.onMirrorStart,
    onMirrorUpdate: props.onMirrorUpdate,
    onMirrorEnd: props.onMirrorEnd,
  });

  const onStart = useCallback(async () => {
    await start({
      onGame: async (rec: InfoIAGameRecord) => {
        await saveRecord(rec);
        setRecords((prev) => [rec, ...prev]);
      },
    });
  }, [start]);

  const onStop = useCallback(() => {
    stop();
  }, [stop]);

  // Export helpers via hook
  const { onExportJSON, onExportBook, onExportCSV } = useExports({ records, compareSets, activeTableSourceId });

  // Remove old JSON-to-DB import; we reuse compare loader for both tabs

  const onDelete = useCallback(async (id: string) => {
    await deleteRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const onClearAll = useCallback(async () => {
    await clearAllRecords();
    setRecords([]);
  }, []);

  // Aggregates for charts moved to utils/aggregates
  // Note: we compute aggregates per-dataset in the charts section directly

  // Colors for comparison datasets moved to utils/colors

  // Parse helpers moved to utils/parse

  // Handlers para publicar/vaciar books bajo demanda (solo dev)
  const onPublishBooks = useCallback(async (minSupportPct: number) => {
    if (!import.meta.env.DEV) return;
    const activeDs = activeTableSourceId === 'local' ? null : (compareSets.find((s) => s.id === activeTableSourceId) || null);
    const current = activeDs ? activeDs.records : records;
    if (!current || current.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('[InfoIA] No hay datos para publicar books.');
      showToast('No hay datos para publicar', 'info');
      return;
    }
    try {
      const res = await publishAllBooksToDevServer({ records: current, minSupportPct });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn('[InfoIA] Publicación de libros falló:', res.error);
        showToast('Error al publicar books', 'error');
      } else {
        // eslint-disable-next-line no-console
        console.log('[InfoIA] Libros publicados en /public/books (dev):', res.wrote);
        const srcLabel = activeTableSourceId === 'local'
          ? 'Local'
          : (compareSets.find((s) => s.id === activeTableSourceId)?.name || activeTableSourceId);
        const filesInfo = Array.isArray(res.filesInfo) ? res.filesInfo : [];
        const totalFiles = filesInfo.length;
        const totalEntries = filesInfo.reduce((acc, f) => acc + (f.entries || 0), 0);
        const totalBytes = filesInfo.reduce((acc, f) => acc + (f.bytes || 0), 0);
        // Show top 10 files (by relativePath) with entries
        const lines: string[] = [];
        lines.push(`Books publicados (soporte ${minSupportPct}%) — Dataset: ${srcLabel}`);
        lines.push(`Archivos: ${totalFiles}, Entradas totales: ${totalEntries}, Bytes: ${totalBytes}`);
        const top = filesInfo
          .slice()
          .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
          .slice(0, 10);
        for (const f of top) {
          lines.push(`- ${f.relativePath}: ${f.entries} entradas, ${f.bytes} bytes`);
        }
        if (filesInfo.length > top.length) {
          lines.push(`… y ${filesInfo.length - top.length} más`);
        }
        showToast(lines.join('\n'), 'success');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[InfoIA] Error publicando libros:', err);
      showToast('Error al publicar books', 'error');
    }
  }, [records, compareSets, activeTableSourceId]);

  const onClearBooks = useCallback(async () => {
    if (!import.meta.env.DEV) return;
    try {
      const res = await clearBooksOnDevServer();
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn('[InfoIA] Vaciar books falló:', res.error);
        showToast('Error al vaciar books', 'error');
      } else {
        // eslint-disable-next-line no-console
        console.log('[InfoIA] Carpeta public/books vaciada.');
        showToast('Books vaciados', 'success');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[InfoIA] Error al vaciar books:', err);
      showToast('Error al vaciar books', 'error');
    }
  }, []);

  const onAddCompareClick = () => compareInputRef.current?.click();
  const onCompareFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await addFilesFromFileList(files);
    if (compareInputRef.current) compareInputRef.current.value = '';
  }, [addFilesFromFileList]);

  const onRemoveCompare = useCallback((id: string) => {
    removeSet(id);
  }, [removeSet]);
  const onClearCompare = useCallback(() => {
    clearSets();
    if (compareInputRef.current) compareInputRef.current.value = '';
  }, [clearSets]);

  // chartDims removed: new comparative chart computes layout per render

  return (
    <section className="panel infoia-panel" aria-label="InfoIA (simulaciones de IA)" style={{ position: 'relative' }}>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: '8px 12px',
            borderRadius: 6,
            background: toast.kind === 'success' ? '#16a34a' : toast.kind === 'error' ? '#dc2626' : '#2563eb',
            color: 'white',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            whiteSpace: 'pre-line',
            maxWidth: 440,
            fontSize: 13,
            zIndex: 10,
          }}
        >
          {toast.message}
        </div>
      )}

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
          <button
            className={activeTab === 'books' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'books'}
            onClick={() => setActiveTab('books')}
            title="Ver y gestionar Books"
          >
            Books
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

      {activeTab === 'books' && (
        <div className="infoia__books" style={{ paddingTop: 8 }}>
          <Books
            onExportBook={onExportBook}
            onPublishBooks={onPublishBooks}
            onClearBooks={onClearBooks}
          />
        </div>
      )}

      {activeTab === 'sim' && (
        <>
          <Controls
            depth={depth}
            onDepthChange={setDepth}
            timeMode={timeMode}
            onTimeModeChange={setTimeMode}
            timeSeconds={timeSeconds}
            onTimeSecondsChange={setTimeSeconds}
            pliesLimit={pliesLimit}
            onPliesLimitChange={setPliesLimit}
            gamesCount={gamesCount}
            onGamesCountChange={setGamesCount}
            mirrorBoard={mirrorBoard}
            onMirrorChange={setMirrorBoard}
            useBook={useBook}
            onUseBookChange={setUseBook}
            running={running}
            loading={loading}
            onStart={onStart}
            onStop={onStop}
            onExportJSON={onExportJSON}
            onExportCSV={onExportCSV}
            onAddCompare={onAddCompareClick}
            onClearAll={onClearAll}
            onResetDefaults={() => {
              // Reset to compiled defaults
              setDepth(3);
              setTimeMode('auto');
              setTimeSeconds(8);
              setPliesLimit(80);
              setGamesCount(10);
              setMirrorBoard(true);
              setUseBook(false);
              // Clear saved preferences so defaults apply when reabrir
              try {
                localStorage.removeItem('pylos.infoia.controls.v1');
              } catch {}
            }}
            activeTableSourceId={activeTableSourceId}
            compareSets={compareSets.map(s => ({ id: s.id, name: s.name, color: s.color }))}
            onSelectTableSource={setActiveTableSourceId}
            canClearLocal={activeTableSourceId === 'local' && records.length > 0}
          />
 
          {/* Per-move time progress */}
          {running && (
            <TimeBar moveIndex={moveIndex} moveElapsedMs={moveElapsedMs} moveTargetMs={moveTargetMs} />
          )}
 
          {(() => {
            const activeDs = activeTableSourceId === 'local' ? null : compareSets.find((s) => s.id === activeTableSourceId) || null;
            const tableRecs = activeDs ? activeDs.records : records;
            const isLoading = activeDs ? false : loading;
            return (
              <TablaIA
                records={tableRecs}
                loading={isLoading}
                allowDelete={activeDs == null}
                onDelete={onDelete}
              />
            );
          })()}
        </>
      )}

      {activeTab === 'charts' && (
        <div className="infoia__charts" style={{ paddingTop: 8 }}>
          {/* Controls for comparison datasets */}
          <CompareBar
            compareSets={compareSets.map(s => ({ id: s.id, name: s.name, color: s.color }))}
            onAdd={onAddCompareClick}
            onRemove={onRemoveCompare}
            onClear={onClearCompare}
          />

          {(() => {
            const local = { id: 'local', name: 'Local', color: '#22c55e', records };
            const datasets = [local, ...compareSets];
            return (
              <ChartContainer datasets={datasets} />
            );
          })()}
        </div>
      )}
    </section>
  );
}

