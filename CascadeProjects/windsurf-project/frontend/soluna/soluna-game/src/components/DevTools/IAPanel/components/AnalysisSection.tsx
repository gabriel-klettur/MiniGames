import type { AIMove } from '../../../../ia/index';
import type { GameState } from '../../../../game/types';
import EvalBar from './EvalBar';
import TopMoves from './TopMoves';
import { idToLabelFactory, fmtMove } from '../utils/format';

export interface AnalysisSectionProps {
  state: GameState;
  evalScore?: number | null;
  depthReached?: number | null;
  pv?: AIMove[];
  nodes?: number;
  elapsedMs?: number;
  nps?: number;
  atRootLabel: string;
  currentLabel: string;
  rootMoves?: Array<{ move: AIMove; score: number }>;
}

export default function AnalysisSection({
  state,
  evalScore = null,
  depthReached = null,
  pv = [],
  nodes = 0,
  elapsedMs = 0,
  nps = 0,
  atRootLabel,
  currentLabel,
  rootMoves,
}: AnalysisSectionProps) {
  const idToLabel = idToLabelFactory(state);
  const pvText = pv && pv.length ? pv.slice(0, 8).map((m) => fmtMove(m, idToLabel)).join(' → ') : 'NO INFO';

  return (
    <div className="ia-panel__analysis" aria-label="Evaluación y análisis" style={{ marginTop: 8 }}>
      {/* Evaluación y PV */}
      <div className="ia-panel__evaluation" aria-label="Evaluación y PV" title={'Evaluación estática y PV (variación principal) de la última búsqueda.'}>
        <EvalBar evalScore={evalScore ?? null} atRootLabel={atRootLabel} />
        <div
          className="pv row info"
          title={'PV — Secuencia de jugadas óptimas encontradas. Útil para depurar decisiones.\n+Ejemplo: merge #a→#b → #c→#d …'}
        >
          PV {depthReached !== null ? `(d=${depthReached})` : ''}: {pvText}
        </div>
      </div>

      {/* KPIs */}
      <div className="ia-panel__kpis" aria-label="Métricas">
        <span className="kpi" title={'Nodos — Estados evaluados durante la última búsqueda. Ej.: 12,345 nodos.'}><strong>Nodos</strong> {(nodes || 0).toLocaleString()}</span>
        <span className="kpi" title={'Tiempo — Duración de la última búsqueda. Ej.: 0.85 s.'}><strong>Tiempo</strong> {((elapsedMs || 0) / 1000).toFixed(2)} s</span>
        <span className="kpi" title={'NPS — Nodes per second. Métrica de rendimiento. Ej.: 25,000 nps.'}><strong>NPS</strong> {Math.round(nps || 0).toLocaleString()}</span>
        <span className="kpi kpi--muted" title={'Turno en la raíz de búsqueda. Afecta el signo de la evaluación.'}><strong>Turno</strong> {currentLabel}</span>
      </div>

      {/* Top jugadas */}
      <TopMoves state={state} rootMoves={rootMoves} />
    </div>
  );
}
