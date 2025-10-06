import type { FC } from 'react';
import Card from './ui/Card';
import Section from './ui/Section';
import PlayerCard from './PlayerCard';
import Summary from './Summary';
import FilterBar from './FilterBar';
import { useRecordsFilter } from '../hooks/useRecordsFilter';
import SimulationLimits from '../views/Controls/SimulationLimits';
import Mirror from '../views/Controls/Mirror';
import TimeBar from '../views/TimeBar';
import TablaIA from '../views/Tabla/TablaIA';
import type { InfoIARecord, PlayerControlsProps } from '../types';

interface SimSectionProps {
  running: boolean;
  visualize: boolean;
  onToggleVisualize: () => void;
  datasetLabel: string;
  // Engine flags
  enableTT: boolean;
  failSoft: boolean;
  preferHashMove: boolean;
  onToggleEnableTT: () => void;
  onToggleFailSoft: () => void;
  onTogglePreferHashMove: () => void;
  enableKillers: boolean;
  enableHistory: boolean;
  onToggleEnableKillers: () => void;
  onToggleEnableHistory: () => void;
  enablePVS: boolean;
  onToggleEnablePVS: () => void;
  enableAspiration: boolean;
  onToggleEnableAspiration: () => void;
  aspirationDelta: number;
  onChangeAspirationDelta: (n: number) => void;
  enableQuiescence: boolean;
  onToggleEnableQuiescence: () => void;
  quiescenceDepth: number;
  onChangeQuiescenceDepth: (n: number) => void;
  setsCount: number;
  onChangeSetsCount: (v: number) => void;
  p1: PlayerControlsProps;
  p2: PlayerControlsProps;
  records: InfoIARecord[];
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
  progDepth?: number;
  progNodes?: number;
  progNps?: number;
  progScore?: number;
  onViewRecord: (id: string) => void;
  onCopyRecord: (id: string) => void;
  onDownloadRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
}

const SimSection: FC<SimSectionProps> = ({
  running,
  visualize,
  onToggleVisualize,
  datasetLabel,
  enableTT,
  failSoft,
  preferHashMove,
  onToggleEnableTT,
  onToggleFailSoft,
  onTogglePreferHashMove,
  enableKillers,
  enableHistory,
  onToggleEnableKillers,
  onToggleEnableHistory,
  enablePVS,
  onToggleEnablePVS,
  enableAspiration,
  onToggleEnableAspiration,
  aspirationDelta,
  onChangeAspirationDelta,
  enableQuiescence,
  onToggleEnableQuiescence,
  quiescenceDepth,
  onChangeQuiescenceDepth,
  setsCount,
  onChangeSetsCount,
  p1,
  p2,
  records,
  moveIndex,
  moveElapsedMs,
  moveTargetMs,
  progDepth = 0,
  progNodes = 0,
  progNps = 0,
  progScore = 0,
  onViewRecord,
  onCopyRecord,
  onDownloadRecord,
  onDeleteRecord,
}) => {
  const {
    winnerFilter,
    setWinnerFilter,
    minDur,
    setMinDur,
    maxDur,
    setMaxDur,
    groupMode,
    setGroupMode,
    filteredRecords,
    groupBySet,
    groupByDepth,
  } = useRecordsFilter(records);

  return (
    <>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
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
            <Section title="Motor IA (flags)">
              <div className="row" style={{ gap: 10, flexDirection: 'column', alignItems: 'flex-start' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={enableTT} onChange={onToggleEnableTT} />
                  Tabla de Transposiciones (TT)
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={failSoft} onChange={onToggleFailSoft} />
                  Fail-soft αβ
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={preferHashMove} onChange={onTogglePreferHashMove} />
                  Priorizar "hash move"
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={enablePVS} onChange={onToggleEnablePVS} />
                  PVS (Principal Variation Search)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={enableAspiration} onChange={onToggleEnableAspiration} />
                    Aspiration Windows
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Δ
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={aspirationDelta}
                      onChange={(e) => onChangeAspirationDelta(Math.max(1, Number(e.target.value) || 1))}
                      style={{ width: 64 }}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={enableQuiescence} onChange={onToggleEnableQuiescence} />
                    Quiescence (solo jugadas tácticas)
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    profundidad
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={quiescenceDepth}
                      onChange={(e) => onChangeQuiescenceDepth(Math.max(1, Number(e.target.value) || 1))}
                      style={{ width: 64 }}
                    />
                  </label>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={enableKillers} onChange={onToggleEnableKillers} />
                  Killers (2 por ply)
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={enableHistory} onChange={onToggleEnableHistory} />
                  History heuristic
                </label>
              </div>
            </Section>
          </Card>

          <Card title="Límites de simulación">
            <SimulationLimits
              setsCount={setsCount}
              onSetsCountChange={onChangeSetsCount}
            />
          </Card>
        </div>

        <PlayerCard
          title="Jugador 1 (ficha clara)"
          depth={p1.depth}
          onChangeDepth={p1.onChangeDepth}
          timeMode={p1.timeMode}
          onChangeTimeMode={p1.onChangeTimeMode}
          timeSeconds={p1.timeSeconds}
          onChangeTimeSeconds={p1.onChangeTimeSeconds}
        />

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

      <Section title="Espejo"><Mirror /></Section>

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

      <FilterBar
        winnerFilter={winnerFilter}
        setWinnerFilter={setWinnerFilter}
        minDur={minDur}
        setMinDur={setMinDur}
        maxDur={maxDur}
        setMaxDur={setMaxDur}
        groupMode={groupMode}
        setGroupMode={setGroupMode}
      />

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
        groupBySet={groupBySet}
        groupByDepth={groupByDepth}
        loading={false}
        onViewRecord={onViewRecord}
        onCopyRecord={onCopyRecord}
        onDownloadRecord={onDownloadRecord}
        onDeleteRecord={onDeleteRecord}
      />
    </>
  );
};

export default SimSection;
