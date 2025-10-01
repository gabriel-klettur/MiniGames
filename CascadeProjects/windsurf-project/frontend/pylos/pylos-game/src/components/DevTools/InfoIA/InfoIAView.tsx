import { useRef, type ChangeEvent } from 'react';
import type { InfoIAGameRecord } from '../../../utils/infoiaDb';
import TablaIA from './views/Tabla/TablaIA';
import ChartContainer from './views/Chart/ChartContainer';
import TimeBar from './views/TimeBar';
import CompareBar from './views/CompareBar';
import Controls from './views/Controls/Controls';
import Books from './views/Books';
import type { TimeMode } from './types';
import RepeatsTab from './views/RepeatsTab';

// Lightweight heads for compare datasets (for UI lists)
export type CompareHead = { id: string; name: string; color: string };
// Full dataset used by charts
export type CompareDataset = { id: string; name: string; color: string; records: InfoIAGameRecord[] };

export type InfoIAViewProps = {
  toast: null | { message: string; kind: 'success' | 'error' | 'info' };
  onToast: (message: string, kind?: 'success' | 'error' | 'info') => void;
  activeTab: 'repeats' | 'sim' | 'charts' | 'books';
  onChangeTab: (tab: 'repeats' | 'sim' | 'charts' | 'books') => void;

  // Controls state
  depth: number;
  timeMode: TimeMode;
  timeSeconds: number;
  pliesLimit: number;
  gamesCount: number;
  mirrorBoard: boolean;
  useBook: boolean;
  running: boolean;
  loading: boolean;

  // Control handlers
  onChangeDepth: (v: number) => void;
  onChangeTimeMode: (v: TimeMode) => void;
  onChangeTimeSeconds: (v: number) => void;
  onChangePliesLimit: (v: number) => void;
  onChangeGamesCount: (v: number) => void;
  onChangeMirror: (v: boolean) => void;
  onChangeUseBook: (v: boolean) => void;
  onStart: () => void;
  onStop: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onClearAll: () => void;
  onResetDefaults: () => void;

  // Records and table
  records: InfoIAGameRecord[];
  groupByDepth: boolean;
  onToggleGroupByDepth: () => void;
  onDelete: (id: string) => void;

  // Table source selection (local vs compare)
  activeTableSourceId: string;
  compareHeads: CompareHead[];
  onSelectTableSource: (id: string) => void;
  canClearLocal: boolean;

  // Compare datasets (for charts)
  compareDatasets: CompareDataset[];

  // Compare actions
  onCompareFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveCompare: (id: string) => void;
  onClearCompare: () => void;

  // Books
  onExportBook: () => void;
  onPublishBooks: (minSupportPct: number) => void;
  onClearBooks: () => void;

  // TimeBar
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
};

export default function InfoIAView(props: InfoIAViewProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onAddCompareClick = () => inputRef.current?.click();
  const handleCompareFiles = (e: ChangeEvent<HTMLInputElement>) => {
    props.onCompareFiles(e);
    if (inputRef.current) inputRef.current.value = '';
  };

  const {
    toast,
    onToast,
    activeTab,
    onChangeTab,
    depth,
    timeMode,
    timeSeconds,
    pliesLimit,
    gamesCount,
    mirrorBoard,
    useBook,
    running,
    loading,
    onChangeDepth,
    onChangeTimeMode,
    onChangeTimeSeconds,
    onChangePliesLimit,
    onChangeGamesCount,
    onChangeMirror,
    onChangeUseBook,
    onStart,
    onStop,
    onExportJSON,
    onExportCSV,
    onClearAll,
    onResetDefaults,
    records,
    groupByDepth,
    onDelete,
    activeTableSourceId,
    compareHeads,
    onSelectTableSource,
    canClearLocal,
    compareDatasets,
    onRemoveCompare,
    onClearCompare,
    onExportBook,
    onPublishBooks,
    onClearBooks,
    moveIndex,
    moveElapsedMs,
    moveTargetMs,
  } = props;

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
            className={activeTab === 'repeats' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'repeats'}
            onClick={() => onChangeTab('repeats')}
            title="Configurar y visualizar jugadas repetidas"
          >
            Jugadas Repetidas
          </button>
          <button
            className={activeTab === 'sim' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'sim'}
            onClick={() => onChangeTab('sim')}
            title="Ver simulaciones y métricas"
          >
            Simulaciones y Métricas
          </button>
          <button
            className={activeTab === 'charts' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'charts'}
            onClick={() => onChangeTab('charts')}
            title="Ver gráficos"
          >
            Gráficos
          </button>
          <button
            className={activeTab === 'books' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'books'}
            onClick={() => onChangeTab('books')}
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
        ref={inputRef}
        type="file"
        accept=".json,application/json,.csv,text/csv"
        multiple
        onChange={handleCompareFiles}
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

      {activeTab === 'repeats' && (
        <RepeatsTab />
      )}

      {activeTab === 'sim' && (
        <>
          <Controls
            depth={depth}
            onDepthChange={onChangeDepth}
            timeMode={timeMode}
            onTimeModeChange={onChangeTimeMode}
            timeSeconds={timeSeconds}
            onTimeSecondsChange={onChangeTimeSeconds}
            pliesLimit={pliesLimit}
            onPliesLimitChange={onChangePliesLimit}
            gamesCount={gamesCount}
            onGamesCountChange={onChangeGamesCount}
            mirrorBoard={mirrorBoard}
            onMirrorChange={onChangeMirror}
            useBook={useBook}
            onUseBookChange={onChangeUseBook}
            running={running}
            loading={loading}
            onStart={onStart}
            onStop={onStop}
            onExportJSON={onExportJSON}
            onExportCSV={onExportCSV}
            onAddCompare={onAddCompareClick}
            onClearAll={onClearAll}
            onResetDefaults={onResetDefaults}
            activeTableSourceId={activeTableSourceId}
            compareSets={compareHeads}
            onSelectTableSource={onSelectTableSource}
            canClearLocal={canClearLocal}
          />

          {/* Per-move time progress */}
          {running && (
            <TimeBar moveIndex={moveIndex} moveElapsedMs={moveElapsedMs} moveTargetMs={moveTargetMs} />
          )}

          {/* Toolbar removed: table is always grouped by default now */}

          {(() => {
            const activeDs = activeTableSourceId === 'local' ? null : compareDatasets.find((s) => s.id === activeTableSourceId) || null;
            const tableRecs = activeDs ? activeDs.records : records;
            const isLoading = activeDs ? false : loading;
            return (
              <TablaIA
                records={tableRecs}
                loading={isLoading}
                allowDelete={activeDs == null}
                onDelete={onDelete}
                groupByDepth={groupByDepth}
                onToast={onToast}
              />
            );
          })()}
        </>
      )}
      {activeTab === 'charts' && (
        <div className="infoia__charts" style={{ paddingTop: 8 }}>
          {/* Controls for comparison datasets */}
          <CompareBar
            compareSets={compareHeads}
            onAdd={onAddCompareClick}
            onRemove={onRemoveCompare}
            onClear={() => {
              onClearCompare();
              if (inputRef.current) inputRef.current.value = '';
            }}
          />

          {(() => {
            const local = { id: 'local', name: 'Local', color: '#22c55e', records };
            const datasets = [local, ...compareDatasets];
            return (
              <ChartContainer datasets={datasets} />
            );
          })()}
        </div>
      )}
    </section>
  );
}
