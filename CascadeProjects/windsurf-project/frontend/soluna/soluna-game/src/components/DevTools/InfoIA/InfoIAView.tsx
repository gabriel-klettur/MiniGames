// Using JSX runtime; no need to import React
import RepeatsTab from './views/RepeatsTab';
import Books from './views/Books';
import CompareBar from './views/CompareBar';
import ChartContainer from './views/Chart/ChartContainer';
import HeaderTabs from './components/HeaderTabs';
import HeaderActions from './components/HeaderActions';
import SimSection from './components/SimSection';
import type { InfoIAViewProps } from './types';

export default function InfoIAView(props: InfoIAViewProps) {
  const {
    running, onStart, onStop, onDefaults, onExportJSON, onExportCSV, onImportFiles, onClearAll,
    onExportCSVDetails,
    activeTab, onChangeTab,
    compareHeads, onAddCompare, onRemoveCompare, onClearCompare, chartDatasets,
    visualize, onToggleVisualize, datasetLabel,
    setsCount, onChangeSetsCount,
    p1, p2,
    records,
    moveIndex, moveElapsedMs, moveTargetMs,
    progDepth = 0, progNodes = 0, progNps = 0, progScore = 0,
    onViewRecord, onCopyRecord, onDownloadRecord, onDeleteRecord,
  } = props;

  return (
    <section className="panel infoia-panel" aria-label="InfoIA">
      {/* Header: title + tabs + status */}
      <div className="infoia__header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h3 className="ia-panel__title" style={{ margin: 0, marginRight: 'auto' }}>InfoIA</h3>
        <HeaderTabs activeTab={activeTab} onChangeTab={onChangeTab} />
        <div className="infoia__status" aria-live="polite">
          {running && (
            <span className="kpi kpi--accent" title="Ejecución en curso">
              <span className="spinner" aria-hidden="true" /> Ejecutando…
            </span>
          )}
        </div>
      </div>

      {/* Header actions */}
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

      {/* Repeats tab (placeholder) */}
      {activeTab === 'repeats' && (
        <div className="section" style={{ marginTop: 12 }}>
          <div className="section-title">Jugadas Repetidas</div>
          <RepeatsTab />
        </div>
      )}

      {/* Charts tab (placeholder) */}
      {activeTab === 'charts' && (
        <div className="section" style={{ marginTop: 12 }}>
          <div className="section-title">Gráficos</div>
          <CompareBar compareSets={compareHeads} onAdd={onAddCompare} onRemove={onRemoveCompare} onClear={onClearCompare} />
          <div style={{ marginTop: 8 }}>
            <ChartContainer datasets={chartDatasets} />
          </div>
        </div>
      )}

      {/* Books tab (placeholder) */}
      {activeTab === 'books' && (
        <div className="section" style={{ marginTop: 12 }}>
          <div className="section-title">Books</div>
          <Books />
        </div>
      )}

      {/* Main grid (Sim tab) */}
      {activeTab === 'sim' && (
        <SimSection
          running={running}
          visualize={visualize}
          onToggleVisualize={onToggleVisualize}
          datasetLabel={datasetLabel}
          setsCount={setsCount}
          onChangeSetsCount={onChangeSetsCount}
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
          onViewRecord={onViewRecord}
          onCopyRecord={onCopyRecord}
          onDownloadRecord={onDownloadRecord}
          onDeleteRecord={onDeleteRecord}
        />
      )}
    </section>
  );
}
