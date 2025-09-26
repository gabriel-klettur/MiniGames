import { useMemo } from 'react';
import type { IAPanelProps } from './types';
import { toRatio } from './utils/math';
import { useTimeBudget } from './hooks/useTimeBudget';
import { useElapsedTimer } from './hooks/useElapsedTimer';
import Header from './components/Header';
import DepthSelector from './components/DepthSelector';
import TimeControls from './components/TimeControls';
import TimeBar from './components/TimeBar';
import Actions from './components/Actions';
import EvaluationBar from './components/EvaluationBar';
import PVLine from './components/PVLine';
import KPIs from './components/KPIs';
import RootMovesList from './components/RootMovesList';
import { SearchSettings, RepetitionSettings, BookSettings, QuiescenceSettings, PerformanceSettings } from './components/Advanced';
import './styles/IAPanel.module.css';
import './styles/components.module.css';

export default function IAPanel(props: IAPanelProps) {
  const {
    state, depth, onChangeDepth, onAIMove, disabled,
    timeMode, timeSeconds, onChangeTimeMode, onChangeTimeSeconds,
    busy = false, progress = null,
    evalScore = null, depthReached = null, pv = [], rootMoves = [], nodes = 0, elapsedMs = 0, nps = 0, rootPlayer, moving = false,
    aiAutoplayActive = false, onToggleAiAutoplay,
    iaConfig, onChangeIaConfig,
  } = props;

  const current = state.currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)';
  const atRootLabel = rootPlayer ? (rootPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)') : current;

  // Presupuesto de tiempo actual (ms)
  const limitMs = useTimeBudget(timeMode, timeSeconds);

  // Elapsed local animado mientras busy = true
  const shownElapsedMs = useElapsedTimer(busy, elapsedMs);
  const ratio = toRatio(shownElapsedMs, limitMs);
  const isOver = typeof limitMs === 'number' && limitMs > 0 && shownElapsedMs >= limitMs;

  const rootSorted = useMemo(() => {
    return (rootMoves || [])
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [rootMoves]);

  return (
    <section className="panel ia-panel" aria-label="Panel de IA">
      {/* Encabezado */}
      <Header title="Inteligencia Artificial" moving={moving} busy={busy} progressDepth={progress?.depth ?? null} />

      {/* Avanzado: Configuración del motor */}
      <details className="ia-panel__advanced" style={{ marginTop: 12 }}>
        <summary>Avanzado</summary>
        <div className="advanced-grid" style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <SearchSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
          <RepetitionSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
          <BookSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
          <QuiescenceSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
          <PerformanceSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
        </div>
      </details>

      {/* Controles */}
      <div className="ia-panel__controls">
        <DepthSelector depth={depth} onChangeDepth={onChangeDepth} />
        <TimeControls
          timeMode={timeMode}
          timeSeconds={timeSeconds}
          onChangeTimeMode={onChangeTimeMode}
          onChangeTimeSeconds={onChangeTimeSeconds}
        />
        {/* Barra de tiempo para visualizar el progreso respecto al límite */}
        <TimeBar ratio={ratio} busy={!!busy} isOver={isOver} shownElapsedMs={shownElapsedMs} limitMs={limitMs} />
        <Actions
          onAIMove={onAIMove}
          disabled={!!disabled}
          aiAutoplayActive={aiAutoplayActive}
          onToggleAiAutoplay={onToggleAiAutoplay}
        />
      </div>

      {/* Evaluación y PV */}
      <div className="ia-panel__evaluation" aria-label="Evaluación y PV">
        <EvaluationBar evalScore={evalScore} atRootLabel={atRootLabel} />
        <PVLine pv={pv} depthReached={depthReached ?? null} />
      </div>

      {/* KPIs */}
      <KPIs nodes={nodes || 0} elapsedMs={elapsedMs || 0} nps={nps || 0} currentLabel={current} />

      {/* Top jugadas */}
      <RootMovesList rootMoves={rootSorted} limit={6} />
    </section>
  );
}

