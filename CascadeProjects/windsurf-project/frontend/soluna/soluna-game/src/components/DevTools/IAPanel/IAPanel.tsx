import { useState } from 'react';
import type { IAPanelProps, TabKey } from './types';
import ControlSection from './components/ControlSection';
import AnalysisSection from './components/AnalysisSection';

 

export default function IAPanel(props: IAPanelProps) {
  const { state, depth, onChangeDepth, onAIMove, disabled, timeMode, timeSeconds, onChangeTimeMode, onChangeTimeSeconds, busy = false, progress = null,
    evalScore = null, depthReached = null, pv = [], rootMoves = [], nodes = 0, elapsedMs = 0, nps = 0, rootPlayer, moving = false,
    aiEnableTT, onToggleAiEnableTT,
    aiFailSoft, onToggleAiFailSoft,
    aiPreferHashMove, onToggleAiPreferHashMove,
    aiEnablePVS, onToggleAiEnablePVS,
    aiEnableAspiration, onToggleAiEnableAspiration, aiAspirationDelta, onChangeAiAspirationDelta,
    aiEnableKillers, onToggleAiEnableKillers,
    aiEnableHistory, onToggleAiEnableHistory,
    aiEnableQuiescence, onToggleAiEnableQuiescence, aiQuiescenceDepth, onChangeAiQuiescenceDepth,
    aiQuiescenceHighTowerThreshold, onChangeAiQuiescenceHighTowerThreshold,
    aiTimeMinMs, onChangeAiTimeMinMs,
    aiTimeMaxMs, onChangeAiTimeMaxMs,
    aiTimeBaseMs, onChangeAiTimeBaseMs,
    aiTimePerMoveMs, onChangeAiTimePerMoveMs,
    aiTimeExponent, onChangeAiTimeExponent,
    aiEditTarget = 1, onChangeAiEditTarget,
  } = props;

  const current = state.currentPlayer === 1 ? 'Jugador 1' : 'Jugador 2';
  const atRootLabel = rootPlayer ? (rootPlayer === 1 ? 'Jugador 1' : 'Jugador 2') : current;

  // Pestañas principales
  const [activeTab, setActiveTab] = useState<TabKey>('control');

  return (
    <section className="panel ia-panel" aria-label="Panel de IA" style={{ width: '100%', maxWidth: 'none', flex: '1 1 auto' }}>
      {/* Encabezado */}
      <div className="ia-panel__header">        
        <div className="ia-panel__status">
          {moving && <span className="kpi kpi--accent" aria-live="polite">Moviendo</span>}
          {busy && !moving && <span className="kpi">Pensando…{progress ? ` d${progress.depth}` : ''}</span>}
          {!busy && !moving && <span className="kpi kpi--muted">En espera</span>}
        </div>
      </div>

      {/* Tabs: Control / Análisis */}
      <div className="ia__tabs segmented" role="tablist" aria-label="Secciones del Panel de IA" style={{ marginTop: 8 }}>
        <button
          className={activeTab === 'control' ? 'active' : ''}
          role="tab"
          aria-selected={activeTab === 'control'}
          onClick={() => setActiveTab('control')}
          title="Controles y acciones de cálculo"
        >
          Control
        </button>
        <button
          className={activeTab === 'analysis' ? 'active' : ''}
          role="tab"
          aria-selected={activeTab === 'analysis'}
          onClick={() => setActiveTab('analysis')}
          title="Evaluación, PV, métricas y top jugadas"
        >
          Análisis
        </button>
      </div>

      {/* Tab: Control */}
      {activeTab === 'control' && (
        <>
          {(typeof aiEditTarget === 'number' && typeof onChangeAiEditTarget === 'function') && (
            <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span className="kpi kpi--muted" title="Selecciona a qué jugador se aplican los toggles de motor del panel (TT, PVS, etc.).">Editando</span>
              <div className="segmented" role="tablist" aria-label="Jugador a editar">
                <button
                  className={aiEditTarget === 1 ? 'active' : ''}
                  role="tab"
                  aria-selected={aiEditTarget === 1}
                  onClick={() => onChangeAiEditTarget(1)}
                  title="Editar opciones del Jugador 1"
                >J1</button>
                <button
                  className={aiEditTarget === 2 ? 'active' : ''}
                  role="tab"
                  aria-selected={aiEditTarget === 2}
                  onClick={() => onChangeAiEditTarget(2)}
                  title="Editar opciones del Jugador 2"
                >J2</button>
              </div>
            </div>
          )}
          <ControlSection
          depth={depth}
          onChangeDepth={onChangeDepth}
          timeMode={timeMode}
          timeSeconds={timeSeconds}
          onChangeTimeMode={onChangeTimeMode}
          onChangeTimeSeconds={onChangeTimeSeconds}
          busy={busy}
          progress={progress}
          disabled={disabled}
          onAIMove={onAIMove}
          elapsedMs={elapsedMs}
          busyElapsedMs={props.busyElapsedMs}
          aiEnableTT={aiEnableTT}
          onToggleAiEnableTT={onToggleAiEnableTT}
          aiFailSoft={aiFailSoft}
          onToggleAiFailSoft={onToggleAiFailSoft}
          aiPreferHashMove={aiPreferHashMove}
          onToggleAiPreferHashMove={onToggleAiPreferHashMove}
          aiEnablePVS={aiEnablePVS}
          onToggleAiEnablePVS={onToggleAiEnablePVS}
          aiEnableAspiration={aiEnableAspiration}
          onToggleAiEnableAspiration={onToggleAiEnableAspiration}
          aiAspirationDelta={aiAspirationDelta}
          onChangeAiAspirationDelta={onChangeAiAspirationDelta}
          aiEnableKillers={aiEnableKillers}
          onToggleAiEnableKillers={onToggleAiEnableKillers}
          aiEnableHistory={aiEnableHistory}
          onToggleAiEnableHistory={onToggleAiEnableHistory}
          aiEnableQuiescence={aiEnableQuiescence}
          onToggleAiEnableQuiescence={onToggleAiEnableQuiescence}
          aiQuiescenceDepth={aiQuiescenceDepth}
          onChangeAiQuiescenceDepth={onChangeAiQuiescenceDepth}
          aiQuiescenceHighTowerThreshold={aiQuiescenceHighTowerThreshold}
          onChangeAiQuiescenceHighTowerThreshold={onChangeAiQuiescenceHighTowerThreshold}
          aiTimeMinMs={aiTimeMinMs}
          onChangeAiTimeMinMs={onChangeAiTimeMinMs}
          aiTimeMaxMs={aiTimeMaxMs}
          onChangeAiTimeMaxMs={onChangeAiTimeMaxMs}
          aiTimeBaseMs={aiTimeBaseMs}
          onChangeAiTimeBaseMs={onChangeAiTimeBaseMs}
          aiTimePerMoveMs={aiTimePerMoveMs}
          onChangeAiTimePerMoveMs={onChangeAiTimePerMoveMs}
          aiTimeExponent={aiTimeExponent}
          onChangeAiTimeExponent={onChangeAiTimeExponent}
        />
        </>
      )}

      {/* Tab: Análisis */}
      {activeTab === 'analysis' && (
        <AnalysisSection
          state={state}
          evalScore={evalScore}
          depthReached={depthReached}
          pv={pv}
          nodes={nodes}
          elapsedMs={elapsedMs}
          nps={nps}
          atRootLabel={atRootLabel}
          currentLabel={current}
          rootMoves={rootMoves}
        />
      )}
    </section>
  );
}

