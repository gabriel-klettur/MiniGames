// Using JSX runtime; no need to import React
import RepeatsTab from './views/RepeatsTab.tsx';
import Books from './views/Books.tsx';
import CompareBar from './views/CompareBar.tsx';
import ChartContainer from './views/Chart/ChartContainer.tsx';
import HeaderTabs from './components/HeaderTabs.tsx';
import HeaderActions from './components/HeaderActions.tsx';
import SimSection from './components/SimSection.tsx';
import type { InfoIAViewProps } from './types.ts';

export default function InfoIAView(props: InfoIAViewProps) {
  const {
    running, onStart, onStop, onDefaults, onExportJSON, onExportCSV, onImportFiles, onClearAll,
    onExportCSVDetails,
    activeTab, onChangeTab,
    compareHeads, onAddCompare, onRemoveCompare, onClearCompare, chartDatasets,
    gamesCount, onChangeGamesCount,
    p1, p2,
    records,
    moveIndex, moveElapsedMs, moveTargetMs,
    progDepth = 0, progNodes = 0, progNps = 0, progScore = 0,
    onCopyRecord, onDownloadRecord, onDeleteRecord,
  } = props;

  return (
    <section className="panel infoia-panel w-full max-w-none flex-1" aria-label="InfoIA">
      {/* Header: title + tabs + status */}
      <div className="infoia__header flex items-center gap-3 mb-2">
        <h3 className="ia-panel__title m-0 mr-auto text-sm font-semibold text-neutral-200">InfoIA</h3>
        <HeaderTabs activeTab={activeTab} onChangeTab={onChangeTab} />
        <div className="infoia__status" aria-live="polite">
          {running && (
            <span className="inline-flex items-center gap-2 text-xs text-emerald-300" title="Ejecución en curso">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" /> Ejecutando…
            </span>
          )}
        </div>
      </div>

      {/* Header actions */}
      <div className="mb-2">
        <HeaderActions
          running={running}
          onStart={onStart}
          onStop={onStop}
          onDefaults={onDefaults}
          onExportJSON={onExportJSON}
          onExportCSV={onExportCSV}
          onExportCSVDetails={onExportCSVDetails}
          onImportFiles={onImportFiles}
          onClearAll={onClearAll}
        />
      </div>

      {/* Repeats tab (placeholder) */}
      {activeTab === 'repeats' && (
        <div className="section mt-3">
          <div className="section-title font-semibold text-neutral-200">Jugadas Repetidas</div>
          <RepeatsTab />
        </div>
      )}

      {/* Charts tab */}
      {activeTab === 'charts' && (
        <div className="section mt-3">
          <div className="section-title font-semibold text-neutral-200">Gráficos</div>
          <CompareBar compareSets={compareHeads} onAdd={onAddCompare} onRemove={onRemoveCompare} onClear={onClearCompare} />
          <div className="mt-2">
            <ChartContainer datasets={chartDatasets} />
          </div>
        </div>
      )}

      {/* Books tab */}
      {activeTab === 'books' && (
        <div className="section mt-3">
          <div className="section-title font-semibold text-neutral-200">Books</div>
          <Books />
        </div>
      )}

      {/* Main grid (Sim tab) */}
      {activeTab === 'sim' && (
        <SimSection
          running={running}
          gamesCount={gamesCount}
          onChangeGamesCount={onChangeGamesCount}
          p1={p1}
          p2={p2}
          records={records}
          moveIndex={moveIndex}
          moveElapsedMs={moveElapsedMs}
          moveTargetMs={moveTargetMs}
          progDepth={progDepth}
          progNodes={progNodes}
          progNps={progNps}
          progScore={progScore}
          onCopyRecord={onCopyRecord}
          onDownloadRecord={onDownloadRecord}
          onDeleteRecord={onDeleteRecord}
        />
      )}
    </section>
  );
}
