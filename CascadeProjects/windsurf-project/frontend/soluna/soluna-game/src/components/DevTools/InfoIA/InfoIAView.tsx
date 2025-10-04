import React, { useMemo, useState } from 'react';
import TimeBar from './views/TimeBar';
import Books from './views/Books';
import RepeatsTab from './views/RepeatsTab';
import CompareBar, { type CompareHead } from './views/CompareBar';
import ChartContainer, { type Dataset } from './views/Chart/ChartContainer';
import SimulationLimits from './views/Controls/SimulationLimits';
import StartSettings from './views/Controls/StartSettings';
import Mirror from './views/Controls/Mirror';
import BookSettings from './views/Controls/BookSettings';
import HeuristicSettings from './views/Controls/HeuristicSettings';
import PersistenceSettings from './views/Controls/PersistenceSettings';
import RepetitionSettings from './views/Controls/RepetitionSettings';
import DifficultyTime from './views/Controls/DifficultyTime';
import AntiStallSettings from './views/Controls/AntiStallSettings';
import TablaIA from './views/Tabla/TablaIA';
import type { ChangeEvent } from 'react';

export type TimeMode = 'auto' | 'manual';

export type InfoIARecord = {
  id: string;
  startedAt: number;
  durationMs: number;
  moves: number;
  winner: 1 | 2 | 0; // 0 = empate/técnico
  p1Depth: number;
  p2Depth: number;
  setId: string;
  setIndex?: number;
  details?: MoveDetail[];
};

export type MoveDetail = {
  index: number;
  elapsedMs: number;
  depthReached?: number;
  nodes?: number;
  nps?: number;
  score?: number;
  bestMove?: any;
  player?: 1 | 2;
  depthUsed?: number;
  applied?: boolean;
  at?: number;
};

export interface PlayerControlsProps {
  title: string;
  depth: number;
  onChangeDepth: (v: number) => void;
  timeMode: TimeMode;
  onChangeTimeMode: (m: TimeMode) => void;
  timeSeconds: number;
  onChangeTimeSeconds: (s: number) => void;
}

export interface InfoIAViewProps {
  // Header actions
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onDefaults: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onExportCSVDetails: () => void;
  onImportFiles: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearAll: () => void;

  // Tabs
  activeTab: 'repeats' | 'sim' | 'charts' | 'books';
  onChangeTab: (t: 'repeats' | 'sim' | 'charts' | 'books') => void;

  // Charts/compare
  compareHeads: CompareHead[];
  onAddCompare: () => void;
  onRemoveCompare: (id: string) => void;
  onClearCompare: () => void;
  chartDatasets: Dataset[];

  // Left panel
  visualize: boolean;
  onToggleVisualize: () => void;
  datasetLabel: string;

  // Results
  records: InfoIARecord[];

  // TimeBar
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
  // Progress metrics
  progDepth?: number;
  progNodes?: number;
  progNps?: number;
  progScore?: number;
  // Limits
  pliesLimit: number;
  setsCount: number;
  onChangePliesLimit: (v: number) => void;
  onChangeSetsCount: (v: number) => void;
  // Per-player controls
  p1: PlayerControlsProps;
  p2: PlayerControlsProps;
  // Table actions
  onViewRecord: (id: string) => void;
  onCopyRecord: (id: string) => void;
  onDownloadRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
}

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card" style={{ border: '1px solid #30363d', borderRadius: 8, padding: 12, background: '#0d1117' }}>
    <div className="card__title" style={{ marginBottom: 8, fontWeight: 600 }}>{title}</div>
    {children}
  </div>
);

const Section: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="section" style={{ marginTop: 10 }}>
    <div className="section-title" style={{ fontSize: 13, opacity: 0.9 }}>{title}</div>
    <div style={{ marginTop: 8 }}>{children}</div>
  </div>
);

function PlayerCard({ title, depth, onChangeDepth, timeMode, onChangeTimeMode, timeSeconds, onChangeTimeSeconds }: PlayerControlsProps) {
  return (
    <Card title={title}>
      <Section title="Dificultad y tiempo">
        <DifficultyTime
          depth={depth}
          onDepthChange={onChangeDepth}
          timeMode={timeMode}
          onTimeModeChange={onChangeTimeMode}
          timeSeconds={timeSeconds}
          onTimeSecondsChange={onChangeTimeSeconds}
        />
      </Section>
      <Section title="Inicio y semilla"><StartSettings /></Section>
      <Section title="Libro (opcional)"><BookSettings /></Section>
      <Section title="Heurística (diagnóstico)"><HeuristicSettings /></Section>
      <Section title="Repetición y penalización"><RepetitionSettings /></Section>
      <Section title="Persistencia y filtros"><PersistenceSettings /></Section>
      <Section title="Anti-estancamiento"><AntiStallSettingsPlaceholder /></Section>
    </Card>
  );
}

// Local alias to keep naming concise in JSX
const AntiStallSettingsPlaceholder = AntiStallSettings;

function Summary({ records }: { records: InfoIARecord[] }) {
  const rounds = records.length;
  const w1 = records.filter(r => r.winner === 1).length;
  const w2 = records.filter(r => r.winner === 2).length;
  const ties = records.filter(r => r.winner === 0).length;
  const wr1 = rounds ? (w1 / rounds) : 0;
  const wr2 = rounds ? (w2 / rounds) : 0;
  const minMs = records.length ? Math.min(...records.map(r => r.durationMs)) : 0;
  const maxMs = records.length ? Math.max(...records.map(r => r.durationMs)) : 0;
  const totalMs = records.reduce((a, r) => a + r.durationMs, 0);
  const setIds = Array.from(new Set(records.map(r => r.setId || 'set:unknown')));
  const sets = setIds.length;
  const roundsPerSet = sets ? (rounds / sets) : 0;
  return (
    <div className="summary row" style={{ justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <span className="kpi"><strong>Distintas vs Unlisted</strong> <span className="kpi kpi--muted">—</span></span>
        <span className="kpi"><strong>Rondas</strong> {rounds}</span>
        <span className="kpi"><strong>Sets</strong> {sets}</span>
        <span className="kpi"><strong>Rondas/Set</strong> {roundsPerSet.toFixed(2)}</span>
        <span className="kpi"><strong>WR (1)</strong> {(wr1*100).toFixed(1)}%</span>
        <span className="kpi"><strong>WR (2)</strong> {(wr2*100).toFixed(1)}%</span>
        <span className="kpi"><strong>Empates</strong> {ties}</span>
      </div>
      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <span className="kpi"><strong>Min (s)</strong> {(minMs/1000).toFixed(2)}</span>
        <span className="kpi"><strong>Máx (s)</strong> {(maxMs/1000).toFixed(2)}</span>
        <span className="kpi"><strong>Total (s)</strong> {(totalMs/1000).toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function InfoIAView(props: InfoIAViewProps) {
  const {
    running, onStart, onStop, onDefaults, onExportJSON, onExportCSV, onImportFiles, onClearAll,
    onExportCSVDetails,
    activeTab, onChangeTab,
    compareHeads, onAddCompare, onRemoveCompare, onClearCompare, chartDatasets,
    visualize, onToggleVisualize, datasetLabel,
    pliesLimit, setsCount, onChangePliesLimit, onChangeSetsCount,
    p1, p2,
    records,
    moveIndex, moveElapsedMs, moveTargetMs,
    progDepth = 0, progNodes = 0, progNps = 0, progScore = 0,
    onViewRecord, onCopyRecord, onDownloadRecord, onDeleteRecord,
  } = props;

  // Local filters (winner and duration range)
  const [winnerFilter, setWinnerFilter] = useState<'all' | '1' | '2' | '0'>('all');
  const [minDur, setMinDur] = useState<string>('');
  const [maxDur, setMaxDur] = useState<string>('');
  const [groupMode, setGroupMode] = useState<'set' | 'depth' | 'none'>('set');
  const filteredRecords = useMemo(() => {
    let arr = records;
    if (winnerFilter !== 'all') {
      const w = Number(winnerFilter) as 0 | 1 | 2;
      arr = arr.filter(r => r.winner === w);
    }
    const minS = Number(minDur);
    const maxS = Number(maxDur);
    if (!Number.isNaN(minS) && minDur !== '') arr = arr.filter(r => r.durationMs >= minS * 1000);
    if (!Number.isNaN(maxS) && maxDur !== '') arr = arr.filter(r => r.durationMs <= maxS * 1000);
    return arr;
  }, [records, winnerFilter, minDur, maxDur]);

  return (
    <section className="panel infoia-panel" aria-label="InfoIA">
      {/* Header: title + tabs + status */}
      <div className="infoia__header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h3 className="ia-panel__title" style={{ margin: 0, marginRight: 'auto' }}>InfoIA</h3>
        <div className="infoia__tabs segmented" role="tablist" aria-label="Secciones de InfoIA">
          <button className={activeTab === 'repeats' ? 'active' : ''} role="tab" aria-selected={activeTab === 'repeats'} onClick={() => onChangeTab('repeats')}>Jugadas Repetidas</button>
          <button className={activeTab === 'sim' ? 'active' : ''} role="tab" aria-selected={activeTab === 'sim'} onClick={() => onChangeTab('sim')}>Simulaciones y Métricas</button>
          <button className={activeTab === 'charts' ? 'active' : ''} role="tab" aria-selected={activeTab === 'charts'} onClick={() => onChangeTab('charts')}>Gráficos</button>
          <button className={activeTab === 'books' ? 'active' : ''} role="tab" aria-selected={activeTab === 'books'} onClick={() => onChangeTab('books')}>Books</button>
        </div>
        <div className="infoia__status" aria-live="polite">
          {running && (
            <span className="kpi kpi--accent" title="Ejecución en curso">
              <span className="spinner" aria-hidden="true" /> Ejecutando…
            </span>
          )}
        </div>
      </div>

      {/* Header actions */}
      <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className={`btn ${running ? 'btn-secondary' : 'btn-primary'}`} onClick={running ? onStop : onStart}>{running ? 'Detener' : 'Iniciar'}</button>
        <button className="btn btn-secondary" onClick={onDefaults}>Default</button>
        <button className="btn btn-secondary" onClick={onExportJSON}>Exportar JSON</button>
        <button className="btn btn-secondary" onClick={onExportCSV}>Exportar CSV</button>
        <button className="btn btn-secondary" onClick={onExportCSVDetails}>Exportar CSV (detalles)</button>
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          Agregar CSV y JSON
          <input type="file" accept=".json,application/json,.csv,text/csv" multiple onChange={onImportFiles} style={{ display: 'none' }} />
        </label>
        <button className="btn btn-danger" onClick={onClearAll}>Borrar todo</button>
        <div style={{ marginLeft: 'auto' }}>
          <span className="kpi">Configuraciones Simulación y Métricas</span>
        </div>
      </div>

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
      <>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
        {/* Left: Visualización & Book + Límites */}
        <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Visualización y book">
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={visualize} onChange={onToggleVisualize} />
                Visualizar
              </label>
            </div>
            <Section title="Inicio (dataset)">
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <span className="kpi">{datasetLabel}</span>
              </div>
            </Section>
          </Card>

          <Card title="Límites de simulación">
            <SimulationLimits
              pliesLimit={pliesLimit}
              onPliesLimitChange={onChangePliesLimit}
              setsCount={setsCount}
              onSetsCountChange={onChangeSetsCount}
            />
          </Card>
        </div>

        {/* Center: Jugador 1 */}
        <PlayerCard
          title="Jugador 1 (ficha clara)"
          depth={p1.depth}
          onChangeDepth={p1.onChangeDepth}
          timeMode={p1.timeMode}
          onChangeTimeMode={p1.onChangeTimeMode}
          timeSeconds={p1.timeSeconds}
          onChangeTimeSeconds={p1.onChangeTimeSeconds}
        />

        {/* Right: Jugador 2 */}
        <PlayerCard
          title="Jugador 2 (ficha oscura)"
          depth={p2.depth}
          onChangeDepth={p2.onChangeDepth}
          timeMode={p2.timeMode}
          onChangeTimeMode={p2.onChangeTimeMode}
          timeSeconds={p2.timeSeconds}
          onChangeTimeSeconds={p2.onChangeTimeSeconds}
        />
      </div>
      {/* Extra: Espejo del tablero (placeholder) */}
      <Section title="Espejo"><Mirror /></Section>
      {/* TimeBar when running */}
      {running && (
        <TimeBar moveIndex={moveIndex} moveElapsedMs={moveElapsedMs} moveTargetMs={moveTargetMs} />
      )}
      {running && (
        <div className="row" style={{ gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
          <span className="kpi"><strong>Depth</strong> {progDepth}</span>
          <span className="kpi"><strong>Nodes</strong> {progNodes.toLocaleString()}</span>
          <span className="kpi"><strong>NPS</strong> {progNps.toLocaleString()}</span>
          <span className="kpi"><strong>Score</strong> {progScore}</span>
        </div>
      )}

      {/* Summary and table */}
      {/* Filters */}
      <div className="row" style={{ gap: 10, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="kpi" style={{ gap: 6 }}>
          <strong>Ganador</strong>
          <select value={winnerFilter} onChange={(e) => setWinnerFilter(e.target.value as any)} style={{ background: 'transparent', color: 'inherit', border: 0 }}>
            <option value="all">Todos</option>
            <option value="1">J1</option>
            <option value="2">J2</option>
            <option value="0">Empate</option>
          </select>
        </label>
        <label className="kpi" style={{ gap: 6 }}>
          <strong>Duración (s)</strong>
          <input placeholder="min" value={minDur} onChange={e => setMinDur(e.target.value)} style={{ width: 64, background: 'transparent', color: 'inherit', border: 0 }} />
          /
          <input placeholder="máx" value={maxDur} onChange={e => setMaxDur(e.target.value)} style={{ width: 64, background: 'transparent', color: 'inherit', border: 0 }} />
        </label>
        <label className="kpi" style={{ gap: 6 }}>
          <strong>Agrupar por</strong>
          <select value={groupMode} onChange={(e) => setGroupMode(e.target.value as any)} style={{ background: 'transparent', color: 'inherit', border: 0 }}>
            <option value="set">Set</option>
            <option value="depth">Dificultad</option>
            <option value="none">Ninguno</option>
          </select>
        </label>
      </div>

      <Summary records={filteredRecords} />

      <TablaIA
        records={filteredRecords.map(r => ({
          id: r.id,
          startedAt: r.startedAt,
          durationMs: r.durationMs,
          moves: r.moves,
          winner: r.winner,
          p1Depth: r.p1Depth,
          p2Depth: r.p2Depth,
          setId: r.setId,
          details: r.details || [],
        }))}
        groupBySet={groupMode === 'set'}
        groupByDepth={groupMode === 'depth'}
        loading={false}
        onViewRecord={onViewRecord}
        onCopyRecord={onCopyRecord}
        onDownloadRecord={onDownloadRecord}
        onDeleteRecord={onDeleteRecord}
      />
      </>
      )}
    </section>
  );
}
