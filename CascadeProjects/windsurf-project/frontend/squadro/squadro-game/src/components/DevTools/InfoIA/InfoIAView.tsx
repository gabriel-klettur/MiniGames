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
    useRootParallel, onToggleUseRootParallel, workers, onChangeWorkers,
    randomOpeningPlies, onChangeRandomOpeningPlies,
    exploreEps, onChangeExploreEps,
    startEligibleLight, onToggleStartEligibleLight,
    startEligibleDark, onToggleStartEligibleDark,
    p1, p2,
    records,
    moveIndex, moveElapsedMs, moveTargetMs,
    progDepth = 0, progNodes = 0, progNps = 0, progScore = 0,
    onCopyRecord, onDownloadRecord, onDeleteRecord,
    onRunSuite,
    suiteResult,
  } = props;

  return (
    <section className="panel infoia-panel w-full max-w-none flex-1" aria-label="InfoIA">
      {/* Header: title + tabs + status */}
      <div className="infoia__header flex items-center gap-3 mb-2">
        <h3 className="ia-panel__title m-0 mr-auto text-sm font-semibold text-neutral-200" title="InfoIA — Panel de experimentación y diagnóstico de IA: simulaciones, análisis, gráficos y libros.">InfoIA</h3>
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
          onExportJSONL={props.onExportJSONL}
          onImportFiles={onImportFiles}
          onClearAll={onClearAll}
          onSaveConfig={props.onSaveConfig}
          onImportConfigFiles={props.onImportConfigFiles}
        />
        {(onRunSuite || props.onExportJUnit) && (
          <div className="mt-2">
            {onRunSuite && (
              <button className="chip-btn mr-2" onClick={onRunSuite} aria-label="Run regression suite" title="Run regression suite">Run Regression Suite</button>
            )}
            {props.onExportJUnit && (
              <button className="chip-btn" onClick={props.onExportJUnit} aria-label="Export JUnit report" title="Export JUnit report">Export JUnit</button>
            )}
          </div>
        )}
      </div>

      {/* Repeats tab (placeholder) */}
      {activeTab === 'repeats' && (
        <div className="section mt-3">
          <div className="section-title font-semibold text-neutral-200" title="Jugadas Repetidas — (Placeholder) Vista para detectar líneas repetitivas y ajustar heurística/ordenación.">Jugadas Repetidas</div>
          <RepeatsTab />
        </div>
      )}

      {/* Charts tab */}
      {activeTab === 'charts' && (
        <div className="section mt-3">
          <div className="section-title font-semibold text-neutral-200" title="Gráficos — Compara datasets por promedio de duración y cantidad. Útil para comparar builds/configuraciones.">Gráficos</div>
          <CompareBar compareSets={compareHeads} onAdd={onAddCompare} onRemove={onRemoveCompare} onClear={onClearCompare} />
          <div className="mt-2">
            <ChartContainer datasets={chartDatasets} />
          </div>
        </div>
      )}

      {/* Books tab */}
      {activeTab === 'books' && (
        <div className="section mt-3">
          <div className="section-title font-semibold text-neutral-200" title="Books — (Placeholder) Espacio para líneas de apertura/guías de juego e importación futura.">Books</div>
          <Books />
        </div>
      )}

      {/* Main grid (Sim tab) */}
      {activeTab === 'sim' && (
        <SimSection
          running={running}
          gamesCount={gamesCount}
          onChangeGamesCount={onChangeGamesCount}
          useRootParallel={useRootParallel}
          onToggleUseRootParallel={onToggleUseRootParallel}
          workers={workers}
          onChangeWorkers={onChangeWorkers}
          randomOpeningPlies={randomOpeningPlies}
          onChangeRandomOpeningPlies={onChangeRandomOpeningPlies}
          exploreEps={exploreEps}
          onChangeExploreEps={onChangeExploreEps}
          startEligibleLight={startEligibleLight}
          onToggleStartEligibleLight={onToggleStartEligibleLight}
          startEligibleDark={startEligibleDark}
          onToggleStartEligibleDark={onToggleStartEligibleDark}
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
      {(suiteResult || props.engineStats) && (
        <div className="mt-3 rounded-lg border border-neutral-700 p-3 bg-neutral-900/60">
          {suiteResult && (
            <>
              <div className="text-sm font-semibold mb-2">Regression Suite</div>
              <div className="text-xs text-neutral-300">Total: {suiteResult.total} · Passed: {suiteResult.passed} · Failed: {suiteResult.failed}</div>
              <ul className="mt-2 text-xs list-disc pl-5">
                {suiteResult.details.map((d, i) => (
                  <li key={i} className={d.ok ? 'text-emerald-300' : 'text-red-300'}>
                    {d.name}: {d.ok ? 'OK' : `FAIL (${d.message || 'expectation failed'})`} · depth={d.depthReached} · move={d.moveId || '-'} · score={d.score}
                  </li>
                ))}
              </ul>
            </>
          )}
          {props.engineStats && (
            <div className="mt-3">
              <div className="text-sm font-semibold mb-1">Engine Stats</div>
              <div className="grid grid-cols-3 gap-2 text-xs text-neutral-300">
                <div>TT probes: {props.engineStats.ttProbes ?? 0}</div>
                <div>TT hits: {props.engineStats.ttHits ?? 0}</div>
                <div>Cutoffs: {props.engineStats.cutoffs ?? 0}</div>
                <div>PVS re: {props.engineStats.pvsReSearches ?? 0}</div>
                <div>LMR red: {props.engineStats.lmrReductions ?? 0}</div>
                <div>Asp re: {props.engineStats.aspReSearches ?? 0}</div>
              </div>
            </div>
          )}
        </div>
      )}
      {props.suiteDiff && (
        <div className="mt-3 rounded-lg border border-neutral-700 p-3 bg-neutral-900/60">
          <div className="text-sm font-semibold mb-2">Baseline Diff</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="font-semibold text-red-300 mb-1">Rotos</div>
              {props.suiteDiff.broke.length === 0 ? (
                <div className="text-neutral-400">—</div>
              ) : (
                <ul className="list-disc pl-5 text-red-300">
                  {props.suiteDiff.broke.map((n) => (<li key={n}>{n}</li>))}
                </ul>
              )}
            </div>
            <div>
              <div className="font-semibold text-emerald-300 mb-1">Arreglados</div>
              {props.suiteDiff.fixed.length === 0 ? (
                <div className="text-neutral-400">—</div>
              ) : (
                <ul className="list-disc pl-5 text-emerald-300">
                  {props.suiteDiff.fixed.map((n) => (<li key={n}>{n}</li>))}
                </ul>
              )}
            </div>
            <div className="col-span-2">
              <div className="font-semibold text-neutral-200 mb-1">Cambiados</div>
              {props.suiteDiff.changed.length === 0 ? (
                <div className="text-neutral-400">—</div>
              ) : (
                <ul className="list-disc pl-5 text-neutral-300">
                  {props.suiteDiff.changed.map((c) => (
                    <li key={c.name}>
                      {c.name}: {c.from ? `${c.from.moveId ?? '-'}@d${c.from.depthReached} (${c.from.score})` : '—'} → {c.to ? `${c.to.moveId ?? '-'}@d${c.to.depthReached} (${c.to.score})` : '—'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="font-semibold text-neutral-200 mb-1">Nuevos</div>
              {props.suiteDiff.newCases.length === 0 ? (
                <div className="text-neutral-400">—</div>
              ) : (
                <ul className="list-disc pl-5 text-neutral-300">
                  {props.suiteDiff.newCases.map((n) => (<li key={n}>{n}</li>))}
                </ul>
              )}
            </div>
            <div>
              <div className="font-semibold text-neutral-200 mb-1">Quitados</div>
              {props.suiteDiff.removed.length === 0 ? (
                <div className="text-neutral-400">—</div>
              ) : (
                <ul className="list-disc pl-5 text-neutral-300">
                  {props.suiteDiff.removed.map((n) => (<li key={n}>{n}</li>))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
