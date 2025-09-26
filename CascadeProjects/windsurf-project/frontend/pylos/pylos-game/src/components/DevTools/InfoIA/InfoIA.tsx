import { useCallback, useEffect, useRef, useState } from 'react';
import type { InfoIAGameRecord } from '../../../utils/infoiaDb';
import type { GameState } from '../../../game/types';

// date utils used inside hooks
import TablaIA from './views/TablaIA';
import ChartContainer from './views/Chart/ChartContainer';
import TimeBar from './views/TimeBar';
import CompareBar from './views/CompareBar';
import Controls from './views/Controls';
import { getAllRecords, saveRecord, deleteRecord, clearAllRecords } from './services/storage';
// parse helpers moved to hooks/useCompareDatasets
import { useCompareDatasets } from './hooks/useCompareDatasets';
import { useExports } from './hooks/useExports';
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
  
  // Comparison datasets for Charts/Tabla
  const { compareSets, activeTableSourceId, setActiveTableSourceId, addFilesFromFileList, removeSet, clearSets } = useCompareDatasets();
  const compareInputRef = useRef<HTMLInputElement | null>(null);
  // Chart sizing handled inside views/Chart with a hook

  // Controls
  const [depth, setDepth] = useState<number>(3);
  const [timeMode, setTimeMode] = useState<TimeMode>('manual');
  const [timeSeconds, setTimeSeconds] = useState<number>(8);
  const [pliesLimit, setPliesLimit] = useState<number>(80);
  const [gamesCount, setGamesCount] = useState<number>(5);
  // Mirror simulation on main board (fast, no animations)
  const [mirrorBoard, setMirrorBoard] = useState<boolean>(false);
 
  // Tabs UI: 'sim' for Simulaciones y Métricas, 'charts' for Gráficos
  const [activeTab, setActiveTab] = useState<'sim' | 'charts'>('sim');

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
            running={running}
            loading={loading}
            onStart={onStart}
            onStop={onStop}
            onExportJSON={onExportJSON}
            onExportCSV={onExportCSV}
            onExportBook={onExportBook}
            onAddCompare={onAddCompareClick}
            onClearAll={onClearAll}
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

