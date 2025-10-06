import { useEffect, useState, type FC } from 'react';
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
  // Collapsible group state (persisted similar a Pylos)
  const STORE_KEY = 'soluna.infoia.controls.group.collapsed';
  const [collapsed, setCollapsed] = useState<boolean>(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw != null) setCollapsed(raw === '1' || raw === 'true');
    } catch {}
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORE_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  };
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
      <div className="infoia__group" style={{ marginTop: 12 }}>
        <div className="infoia__group-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div className="section-title" style={{ fontWeight: 600 }}>Configuraciones Simulación y Métricas</div>
          <button
            type="button"
            className="infoia__group-toggle"
            onClick={toggleCollapsed}
            style={{ background: 'rgba(17,24,39,0.55)', color: 'var(--text)', border: '1px solid var(--panel-border-color)', borderRadius: 9999, padding: '6px 10px' }}
          >
            {collapsed ? 'Expandir' : 'Contraer'} ▾
          </button>
        </div>

      {!collapsed && (
        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
          <div className="col" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            enableTT={p1.enableTT}
            onToggleEnableTT={p1.onToggleEnableTT}
            failSoft={p1.failSoft}
            onToggleFailSoft={p1.onToggleFailSoft}
            preferHashMove={p1.preferHashMove}
            onTogglePreferHashMove={p1.onTogglePreferHashMove}
            enableKillers={p1.enableKillers}
            onToggleEnableKillers={p1.onToggleEnableKillers}
            enableHistory={p1.enableHistory}
            onToggleEnableHistory={p1.onToggleEnableHistory}
            enablePVS={p1.enablePVS}
            onToggleEnablePVS={p1.onToggleEnablePVS}
            enableAspiration={p1.enableAspiration}
            onToggleEnableAspiration={p1.onToggleEnableAspiration}
            aspirationDelta={p1.aspirationDelta}
            onChangeAspirationDelta={p1.onChangeAspirationDelta}
            enableQuiescence={p1.enableQuiescence}
            onToggleEnableQuiescence={p1.onToggleEnableQuiescence}
            quiescenceDepth={p1.quiescenceDepth}
            onChangeQuiescenceDepth={p1.onChangeQuiescenceDepth}
            quiescenceHighTowerThreshold={p1.quiescenceHighTowerThreshold}
            onChangeQuiescenceHighTowerThreshold={p1.onChangeQuiescenceHighTowerThreshold}
            enableLMR={p1.enableLMR}
            onToggleEnableLMR={p1.onToggleEnableLMR}
            lmrMinDepth={p1.lmrMinDepth}
            onChangeLmrMinDepth={p1.onChangeLmrMinDepth}
            lmrLateMoveIdx={p1.lmrLateMoveIdx}
            onChangeLmrLateMoveIdx={p1.onChangeLmrLateMoveIdx}
            lmrReduction={p1.lmrReduction}
            onChangeLmrReduction={p1.onChangeLmrReduction}
            enableFutility={p1.enableFutility}
            onToggleEnableFutility={p1.onToggleEnableFutility}
            futilityMargin={p1.futilityMargin}
            onChangeFutilityMargin={p1.onChangeFutilityMargin}
            enableLMP={p1.enableLMP}
            onToggleEnableLMP={p1.onToggleEnableLMP}
            lmpDepthThreshold={p1.lmpDepthThreshold}
            onChangeLmpDepthThreshold={p1.onChangeLmpDepthThreshold}
            lmpLateMoveIdx={p1.lmpLateMoveIdx}
            onChangeLmpLateMoveIdx={p1.onChangeLmpLateMoveIdx}
            enableNullMove={p1.enableNullMove}
            onToggleEnableNullMove={p1.onToggleEnableNullMove}
            nullMoveReduction={p1.nullMoveReduction}
            onChangeNullMoveReduction={p1.onChangeNullMoveReduction}
            nullMoveMinDepth={p1.nullMoveMinDepth}
            onChangeNullMoveMinDepth={p1.onChangeNullMoveMinDepth}
          />
          <PlayerCard
            title="Jugador 2 (ficha oscura)"
            depth={p2.depth}
            onChangeDepth={p2.onChangeDepth}
            timeMode={p2.timeMode}
            onChangeTimeMode={p2.onChangeTimeMode}
            timeSeconds={p2.timeSeconds}
            onChangeTimeSeconds={p2.onChangeTimeSeconds}
            enableTT={p2.enableTT}
            onToggleEnableTT={p2.onToggleEnableTT}
            failSoft={p2.failSoft}
            onToggleFailSoft={p2.onToggleFailSoft}
            preferHashMove={p2.preferHashMove}
            onTogglePreferHashMove={p2.onTogglePreferHashMove}
            enableKillers={p2.enableKillers}
            onToggleEnableKillers={p2.onToggleEnableKillers}
            enableHistory={p2.enableHistory}
            onToggleEnableHistory={p2.onToggleEnableHistory}
            enablePVS={p2.enablePVS}
            onToggleEnablePVS={p2.onToggleEnablePVS}
            enableAspiration={p2.enableAspiration}
            onToggleEnableAspiration={p2.onToggleEnableAspiration}
            aspirationDelta={p2.aspirationDelta}
            onChangeAspirationDelta={p2.onChangeAspirationDelta}
            enableQuiescence={p2.enableQuiescence}
            onToggleEnableQuiescence={p2.onToggleEnableQuiescence}
            quiescenceDepth={p2.quiescenceDepth}
            onChangeQuiescenceDepth={p2.onChangeQuiescenceDepth}
            quiescenceHighTowerThreshold={p2.quiescenceHighTowerThreshold}
            onChangeQuiescenceHighTowerThreshold={p2.onChangeQuiescenceHighTowerThreshold}
            enableLMR={p2.enableLMR}
            onToggleEnableLMR={p2.onToggleEnableLMR}
            lmrMinDepth={p2.lmrMinDepth}
            onChangeLmrMinDepth={p2.onChangeLmrMinDepth}
            lmrLateMoveIdx={p2.lmrLateMoveIdx}
            onChangeLmrLateMoveIdx={p2.onChangeLmrLateMoveIdx}
            lmrReduction={p2.lmrReduction}
            onChangeLmrReduction={p2.onChangeLmrReduction}
            enableFutility={p2.enableFutility}
            onToggleEnableFutility={p2.onToggleEnableFutility}
            futilityMargin={p2.futilityMargin}
            onChangeFutilityMargin={p2.onChangeFutilityMargin}
            enableLMP={p2.enableLMP}
            onToggleEnableLMP={p2.onToggleEnableLMP}
            lmpDepthThreshold={p2.lmpDepthThreshold}
            onChangeLmpDepthThreshold={p2.onChangeLmpDepthThreshold}
            lmpLateMoveIdx={p2.lmpLateMoveIdx}
            onChangeLmpLateMoveIdx={p2.onChangeLmpLateMoveIdx}
            enableNullMove={p2.enableNullMove}
            onToggleEnableNullMove={p2.onToggleEnableNullMove}
            nullMoveReduction={p2.nullMoveReduction}
            onChangeNullMoveReduction={p2.onChangeNullMoveReduction}
            nullMoveMinDepth={p2.nullMoveMinDepth}
            onChangeNullMoveMinDepth={p2.onChangeNullMoveMinDepth}
          />
        </div>
      )}

      {!collapsed && (
        <>
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
            records={filteredRecords.map((r: any) => ({
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
      )}
      </div>
    </>
  );
}

export default SimSection;
