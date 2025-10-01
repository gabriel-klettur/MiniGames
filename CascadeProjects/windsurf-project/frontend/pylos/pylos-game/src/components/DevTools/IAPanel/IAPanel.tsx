import { useMemo, useState } from 'react';
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
import { SearchSettings, RepetitionSettings, BookSettings, QuiescenceSettings, PerformanceSettings, StartSettings, AntiStallSettings } from './components/Advanced';
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

  // UI: pestañas de categoría
  const [activeTab, setActiveTab] = useState<'control' | 'analysis' | 'advanced'>('control');

  return (
    <section className="panel ia-panel" aria-label="Panel de IA">
      {/* Encabezado */}
      <Header title="Inteligencia Artificial" moving={moving} busy={busy} progressDepth={progress?.depth ?? null} />

      {/* Tabs de categoría, estilo similar a InfoIA */}
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
        <button
          className={activeTab === 'advanced' ? 'active' : ''}
          role="tab"
          aria-selected={activeTab === 'advanced'}
          onClick={() => setActiveTab('advanced')}
          title="Configuración avanzada del motor"
        >
          Avanzado
        </button>
      </div>

      {/* Tab: Control */}
      {activeTab === 'control' && (
        <div className="ia-panel__controls" style={{ marginTop: 8 }}>
          <DepthSelector depth={depth} onChangeDepth={onChangeDepth} />
          <TimeControls
            timeMode={timeMode}
            timeSeconds={timeSeconds}
            onChangeTimeMode={onChangeTimeMode}
            onChangeTimeSeconds={onChangeTimeSeconds}
          />
          {/* Quick toggle for using opening books */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              id="ia-usebook"
              type="checkbox"
              checked={!!iaConfig.bookEnabled}
              onChange={(e) => onChangeIaConfig({ bookEnabled: e.target.checked })}
            />
            <label htmlFor="ia-usebook" title="Usar libro de aperturas si está disponible">Utilizar books</label>
          </div>
          {/* Barra de tiempo para visualizar el progreso respecto al límite */}
          <TimeBar ratio={ratio} busy={!!busy} isOver={isOver} shownElapsedMs={shownElapsedMs} limitMs={limitMs} />
          <Actions
            onAIMove={onAIMove}
            disabled={!!disabled}
            aiAutoplayActive={aiAutoplayActive}
            onToggleAiAutoplay={onToggleAiAutoplay}
          />
        </div>
      )}

      {/* Tab: Análisis */}
      {activeTab === 'analysis' && (
        <div className="ia-panel__analysis" aria-label="Evaluación y análisis" style={{ marginTop: 8 }}>
          {/* Evaluación y PV */}
          <div className="ia-panel__evaluation">
            <EvaluationBar evalScore={evalScore} atRootLabel={atRootLabel} />
            <PVLine pv={pv} depthReached={depthReached ?? null} />
          </div>

          {/* KPIs */}
          <KPIs nodes={nodes || 0} elapsedMs={elapsedMs || 0} nps={nps || 0} currentLabel={current} />

          {/* Top jugadas */}
          <RootMovesList rootMoves={rootSorted} limit={6} />
        </div>
      )}

      {/* Tab: Avanzado */}
      {activeTab === 'advanced' && (
        <div className="ia-panel__advanced" style={{ marginTop: 8 }}>
          {/* Estructura por paneles al estilo RepeatsTab: tarjetas con título y contenido */}
          <div className="row" style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div className="panel small" style={{ minWidth: 300 }} title="Algoritmos y heurísticas de búsqueda (PVS, aspiración, TT)">
              <h4 style={{ marginTop: 0 }}>Búsqueda</h4>
              <SearchSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
            </div>

            <div className="panel small" style={{ minWidth: 300 }} title="Evitar repeticiones en raíz dentro de la partida">
              <h4 style={{ marginTop: 0 }}>Repeticiones (intra-partida)</h4>
              <RepetitionSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
            </div>

            <div className="panel small" style={{ minWidth: 300 }} title="Uso de libros de aperturas y fuente de datos">
              <h4 style={{ marginTop: 0 }}>Books</h4>
              <BookSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
            </div>

            <div className="panel small" style={{ minWidth: 300 }} title="Extensión quiescente y parámetros de recorte">
              <h4 style={{ marginTop: 0 }}>Quiescence</h4>
              <QuiescenceSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
            </div>

            <div className="panel small" style={{ minWidth: 300 }} title="Optimizaciones de rendimiento y precomputados">
              <h4 style={{ marginTop: 0 }}>Rendimiento</h4>
              <PerformanceSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
            </div>

            <div className="panel small" style={{ minWidth: 300 }} title="Comportamiento en la primera jugada (semilla, aleatoriedad)">
              <h4 style={{ marginTop: 0 }}>Inicio de partida</h4>
              <StartSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
            </div>

            <div className="panel" style={{ minWidth: 300 }} title="Ajustes anti-estancamiento a nivel raíz (novedad, Top-K, jitter, LMR, sesgo de tablas)">
              <h4 style={{ marginTop: 0 }}>Anti-stall (raíz)</h4>
              <AntiStallSettings iaConfig={iaConfig} onChangeIaConfig={onChangeIaConfig} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

