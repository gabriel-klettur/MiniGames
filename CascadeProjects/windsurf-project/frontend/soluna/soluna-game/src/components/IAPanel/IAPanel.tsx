import type { GameState } from '../../game/types';
import type { AIMove } from '../../ia/index';

export interface IAPanelProps {
  state: GameState;
  depth: number; // 1..10
  onChangeDepth: (d: number) => void;
  onAIMove: () => void;
  disabled?: boolean;
  // Control profesional: modo Auto o Manual (0..30 s)
  timeMode: 'auto' | 'manual';
  timeSeconds: number; // 0..30
  onChangeTimeMode: (m: 'auto' | 'manual') => void;
  onChangeTimeSeconds: (secs: number) => void;
  busy?: boolean;
  progress?: { depth: number; score: number } | null;
  // Result summary (último cálculo)
  evalScore?: number | null;
  depthReached?: number | null;
  pv?: AIMove[];
  rootMoves?: Array<{ move: AIMove; score: number }>;
  nodes?: number;
  elapsedMs?: number;
  nps?: number;
  rootPlayer?: 1 | 2;
  moving?: boolean; // si hay animación en curso
  // Autoplay IA
  aiAutoplayActive?: boolean;
  onToggleAiAutoplay?: () => void;
  // Tiempo en curso mientras está pensando
  busyElapsedMs?: number;
}

function normEval(v: number): number {
  const scaled = Math.tanh(v / 25);
  return Math.max(-1, Math.min(1, scaled));
}

export default function IAPanel(props: IAPanelProps) {
  const { state, depth, onChangeDepth, onAIMove, disabled, timeMode, timeSeconds, onChangeTimeMode, onChangeTimeSeconds, busy = false, progress = null,
    evalScore = null, depthReached = null, pv = [], rootMoves = [], nodes = 0, elapsedMs = 0, nps = 0, rootPlayer, moving = false,
    aiAutoplayActive = false, onToggleAiAutoplay } = props;

  const current = state.currentPlayer === 1 ? 'Jugador 1' : 'Jugador 2';
  const atRootLabel = rootPlayer ? (rootPlayer === 1 ? 'Jugador 1' : 'Jugador 2') : current;

  const idToLabel = (id: string): string => {
    const t = state.towers.find(tt => tt.id === id);
    if (!t) return id;
    return `#${id.slice(0, 3)} h${t.height}·${t.top}`;
  };

  function fmtMove(m: AIMove): string {
    if (m.kind === 'merge') {
      return `merge ${idToLabel(m.sourceId)}→${idToLabel(m.targetId)}`;
    }
    return '—';
  }

  return (
    <section className="panel ia-panel" aria-label="Panel de IA">
      {/* Encabezado */}
      <div className="ia-panel__header">
        <h3 className="ia-panel__title">Inteligencia Artificial</h3>
        <div className="ia-panel__status">
          {moving && <span className="kpi kpi--accent" aria-live="polite">Moviendo</span>}
          {busy && !moving && <span className="kpi">Pensando…{progress ? ` d${progress.depth}` : ''}</span>}
          {!busy && !moving && <span className="kpi kpi--muted">En espera</span>}
        </div>
      </div>

      {/* Controles */}
      <div className="ia-panel__controls">
        <label htmlFor="ia-depth" className="label">Profundidad</label>
        <select id="ia-depth" value={depth} onChange={(e) => onChangeDepth(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <label className="label">Tiempo</label>
        <div className="segmented" role="group" aria-label="Modo de tiempo IA">
          <button className={timeMode === 'auto' ? 'active' : ''} onClick={() => onChangeTimeMode('auto')} aria-pressed={timeMode === 'auto'}>Auto</button>
          <button className={timeMode === 'manual' ? 'active' : ''} onClick={() => onChangeTimeMode('manual')} aria-pressed={timeMode === 'manual'}>Manual</button>
        </div>
        {timeMode === 'manual' && (
          <div className="ia-panel__range" aria-label="Selector de tiempo manual">
            <input
              type="range"
              min={0}
              max={30}
              step={0.5}
              value={timeSeconds}
              onChange={(e) => onChangeTimeSeconds(Number(e.target.value))}
              aria-valuemin={0}
              aria-valuemax={30}
              aria-valuenow={timeSeconds}
            />
            <span className="range-value">{timeSeconds.toFixed(1)} s</span>
          </div>
        )}
        <div className="ia-panel__actions">
          <button
            className={`btn btn-primary ${busy ? 'loading' : ''}`}
            onClick={onAIMove}
            disabled={disabled || busy}
            aria-label={busy ? 'IA pensando' : 'Mover IA'}
            title={busy ? 'IA pensando…' : 'Mover IA'}
          >
            {busy ? (
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span className="ia-btn__spinner" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25" />
                    <path d="M21 12a9 9 0 0 1-9 9" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </span>
                <span className="btn-label" aria-live="polite">
                  Pensando{progress?.depth ? ` d${progress.depth}` : ''}{typeof props.busyElapsedMs === 'number' ? ` · ${(props.busyElapsedMs / 1000).toFixed(1)}s` : ''}
                </span>
                <span className="ia-btn__dots" aria-hidden="true">
                  <span>•</span><span>•</span><span>•</span>
                </span>
              </span>
            ) : (
              <>
                <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M11 2h2v3h-2z"/>
                  <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
                  <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
                  <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
                  <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
                </svg>
                <span className="sr-only">Mover IA</span>
              </>
            )}
          </button>
          <button
            onClick={onToggleAiAutoplay}
            aria-pressed={aiAutoplayActive}
            disabled={disabled && !aiAutoplayActive}
            title={aiAutoplayActive ? 'Detener autoplay de la IA' : 'Iniciar autoplay de la IA'}
            aria-label={aiAutoplayActive ? 'Detener autoplay de la IA' : 'Iniciar autoplay de la IA'}
          >
            {aiAutoplayActive ? (
              <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M6 6h12v12H6z" />
              </svg>
            ) : (
              <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M8 5v14l11-7z" />
              </svg>
            )}
            <span className="sr-only">{aiAutoplayActive ? 'Detener autoplay de la IA' : 'Iniciar autoplay de la IA'}</span>
          </button>
        </div>
      </div>

      {/* Evaluación y PV */}
      <div className="ia-panel__evaluation" aria-label="Evaluación y PV">
        <div className="eval">
          <div
            className="eval-bar"
            title={evalScore !== null && evalScore !== undefined ? `Eval para ${atRootLabel}: ${evalScore.toFixed(1)}` : 'Sin datos'}
          >
            <div
              className="eval-bar__fill"
              style={{ width: `${(evalScore !== null && evalScore !== undefined ? ((normEval(evalScore) + 1) / 2) : 0) * 100}%` }}
            />
          </div>
          <span className="eval-value">
            {evalScore !== null && evalScore !== undefined ? (evalScore > 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1)) : 'NO INFO'}
          </span>
        </div>
        <div className="pv row info">PV {depthReached !== null ? `(d=${depthReached})` : ''}: {pv && pv.length ? pv.slice(0, 8).map(fmtMove).join(' → ') : 'NO INFO'}</div>
      </div>

      {/* KPIs */}
      <div className="ia-panel__kpis" aria-label="Métricas">
        <span className="kpi"><strong>Nodos</strong> {(nodes || 0).toLocaleString()}</span>
        <span className="kpi"><strong>Tiempo</strong> {((elapsedMs || 0) / 1000).toFixed(2)} s</span>
        <span className="kpi"><strong>NPS</strong> {Math.round(nps || 0).toLocaleString()}</span>
        <span className="kpi kpi--muted"><strong>Turno</strong> {current}</span>
      </div>

      {/* Top jugadas */}
      <div className="ia-panel__moves" aria-label="Top movimientos">
        <div className="section-title">Top jugadas (raíz)</div>
        {(() => {
          const sorted = (rootMoves || [])
            .slice()
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);
          const filled = [...sorted];
          while (filled.length < 6) filled.push(undefined as any);
          const maxAbs = sorted.length > 0 ? Math.max(...sorted.map(r => Math.abs(r.score))) : 0;
          return (
            <ol className="moves-list">
              {filled.map((r, i) => {
                const has = !!r;
                const label = has ? `${fmtMove(r!.move)} — ${r!.score > 0 ? `+${r!.score.toFixed(1)}` : r!.score.toFixed(1)}` : 'NO INFO';
                const ratio = has && maxAbs > 0 ? Math.min(1, Math.abs(r!.score) / maxAbs) : 0;
                return (
                  <li key={i} className="move-item">
                    <div className="mini-bar" aria-hidden="true">
                      <div className="mini-bar__fill" style={{ width: `${ratio * 100}%` }} />
                    </div>
                    <span className="move-label">{label}</span>
                  </li>
                );
              })}
            </ol>
          );
        })()}
      </div>
    </section>
  );
}

