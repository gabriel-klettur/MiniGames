import { useMemo, useState } from 'react';
import type { GameState } from '../../../game/types';
import type { AIMove } from '../../../ia/index';

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
  // Autoplay IA (se mantienen para compatibilidad pero no se renderiza botón)
  aiAutoplayActive?: boolean;
  onToggleAiAutoplay?: () => void;
  // Tiempo en curso mientras está pensando
  busyElapsedMs?: number;
  // Engine flags (toggles + params)
  aiEnableTT: boolean;
  onToggleAiEnableTT: () => void;
  aiFailSoft: boolean;
  onToggleAiFailSoft: () => void;
  aiPreferHashMove: boolean;
  onToggleAiPreferHashMove: () => void;
  aiEnablePVS: boolean;
  onToggleAiEnablePVS: () => void;
  aiEnableAspiration: boolean;
  onToggleAiEnableAspiration: () => void;
  aiAspirationDelta: number;
  onChangeAiAspirationDelta: (n: number) => void;
  aiEnableKillers: boolean;
  onToggleAiEnableKillers: () => void;
  aiEnableHistory: boolean;
  onToggleAiEnableHistory: () => void;
  aiEnableQuiescence: boolean;
  onToggleAiEnableQuiescence: () => void;
  aiQuiescenceDepth: number;
  onChangeAiQuiescenceDepth: (n: number) => void;
}

function normEval(v: number): number {
  const scaled = Math.tanh(v / 25);
  return Math.max(-1, Math.min(1, scaled));
}

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
  } = props;

  const current = state.currentPlayer === 1 ? 'Jugador 1' : 'Jugador 2';
  const atRootLabel = rootPlayer ? (rootPlayer === 1 ? 'Jugador 1' : 'Jugador 2') : current;

  // Presupuesto de tiempo (ms) y progreso mostrado
  const limitMs: number | null = timeMode === 'manual' ? Math.max(0, (timeSeconds || 0) * 1000) : null;
  const shownElapsedMs = busy ? (typeof props.busyElapsedMs === 'number' ? props.busyElapsedMs : elapsedMs || 0) : (elapsedMs || 0);
  const ratio = typeof limitMs === 'number' && limitMs > 0 ? Math.min(1, shownElapsedMs / limitMs) : 0;
  const isOver = typeof limitMs === 'number' && limitMs > 0 && shownElapsedMs >= limitMs;

  // Ordenar jugadas raíz con memo
  const rootSorted = useMemo(() => {
    return (rootMoves || [])
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [rootMoves]);

  // Pestañas principales
  const [activeTab, setActiveTab] = useState<'control' | 'analysis'>('control');

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

  const fmtScore = (v: number | null | undefined): string => {
    if (v === null || v === undefined) return 'NO INFO';
    if (!Number.isFinite(v)) return v > 0 ? 'WIN' : v < 0 ? 'LOSS' : '—';
    return v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
  };

  return (
    <section className="panel ia-panel" aria-label="Panel de IA">
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
        <div className="ia-panel__controls" style={{ marginTop: 8 }}>
          <label
            htmlFor="ia-depth"
            className="label"
            title={
              'Profundidad de búsqueda (minimax). Cada +1 aumenta el horizonte.\n+Ejemplo: d=2 mira mi jugada y la respuesta rival. d=3 añade mi réplica.\n+Trade-off: más profundidad = más nodos (más lento) pero decisiones más sólidas.'
            }
          >
            Profundidad
          </label>
          <select
            id="ia-depth"
            value={depth}
            onChange={(e) => onChangeDepth(Number(e.target.value))}
            title={
              'Selecciona d. Regla guía: d=2–3 rápido; d=4–5 medio; d>=6 pesado.\n+Consejo: usar TT/PVS/Aspiration para acelerar a d altos.'
            }
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <label className="label">Tiempo</label>
          <div className="segmented" role="group" aria-label="Modo de tiempo IA">
            <button
              className={timeMode === 'auto' ? 'active' : ''}
              onClick={() => onChangeTimeMode('auto')}
              aria-pressed={timeMode === 'auto'}
              title={'Auto: usa sólo profundidad fija. Recomendado para comparabilidad de resultados.'}
            >
              Auto
            </button>
            <button
              className={timeMode === 'manual' ? 'active' : ''}
              onClick={() => onChangeTimeMode('manual')}
              aria-pressed={timeMode === 'manual'}
              title={'Manual: asigna un presupuesto de tiempo por jugada (ms). Ej.: 3.0 s.'}
            >
              Manual
            </button>
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
                title={
                  'Tiempo objetivo por jugada (segundos). Ej.: 2.5 s. '
                  + 'Afecta iterative deepening: profundiza hasta agotar el presupuesto.'
                }
              />
              <span className="range-value">{timeSeconds.toFixed(1)} s</span>
            </div>
          )}

          {/* Barra de tiempo visual al estilo Pylos */}
          {timeMode === 'manual' && (
            <div
              className="ia-timebar"
              aria-label="Progreso de tiempo"
              title={typeof limitMs === 'number' ? `${(shownElapsedMs / 1000).toFixed(1)}s / ${(limitMs / 1000).toFixed(1)}s` : 'Sin límite'}
              style={{
                position: 'relative',
                height: 10,
                background: '#1e1e1e',
                border: '1px solid #444',
                borderRadius: 6,
                overflow: 'hidden',
                marginTop: 8,
              }}
            >
              <div
                className="ia-timebar__fill"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${ratio * 100}%`,
                  transition: 'width 120ms linear',
                  background: isOver ? '#7a1f1f' : '#2a6bcc',
                }}
              />
            </div>
          )}

          <div className="ia-panel__actions" style={{ marginTop: 8 }}>
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
            {/* Botón de autoplay eliminado intencionalmente para DevTools */}
          </div>

          {/* Ajustes del motor IA (flags rápidos) */}
          <div className="ia-panel__engine" style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title={`TT — Tabla de Transposiciones: cachea evaluaciones por hash del estado.\n+Beneficio: evita recalcular subárboles y mejora el orden de movimientos (hash move).\nEjemplo: posiciones alcanzadas por distinto orden de merges comparten resultado.`}
            >
              <input type="checkbox" checked={aiEnableTT} onChange={onToggleAiEnableTT} /> TT
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={aiFailSoft} onChange={onToggleAiFailSoft} />
              <span
                title={
                  'Fail-soft — En cortes devuelve el valor real del hijo (no sólo α/β).'
                  + '\nBeneficio: mejores ventanas en iteraciones siguientes y ranking raíz.'
                  + '\nEjemplo: si hijo=+37 supera β=+30, se guarda +37 (no +30).'
                }
              >
                Fail-soft
              </span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={aiPreferHashMove} onChange={onToggleAiPreferHashMove} />
              <span
                title={`Hash move — Prioriza primero la mejor jugada almacenada en TT.\n+Beneficio: más podas β por mejor ordenación.\nEjemplo: si TT sugiere merge A+B, se explora antes que otras.`}
              >
                Hash move
              </span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={aiEnablePVS} onChange={onToggleAiEnablePVS} />
              <span
                title={
                  'PVS — Principal Variation Search: primer hijo ventana completa, resto ventana nula.'
                  + '\nBeneficio: reduce nodos manteniendo exactitud.'
                  + '\nEjemplo: tras buen ordering, muchos hijos fallan rápido con [α, α+1].'
                }
              >
                PVS
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={aiEnableAspiration} onChange={onToggleAiEnableAspiration} />
                <span
                  title={
                    'Aspiration Windows — Busca alrededor del score previo y reintenta si falla.'
                    + '\nBeneficio: ventanas estrechas aceleran la poda.'
                    + '\nEjemplo: score previo +40 → ventana [+30,+50]. Si falla, amplía a completa.'
                  }
                >
                  Aspiration
                </span>
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={aiAspirationDelta}
                onChange={(e) => onChangeAiAspirationDelta(Math.max(1, Number(e.target.value) || 1))}
                style={{ width: 58 }}
                aria-label="Aspiration Δ"
                title={'Δ de aspiración (margen alrededor del score previo). Ej.: 25 → [S-25,S+25].'}
              />
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={aiEnableKillers} onChange={onToggleAiEnableKillers} />
              <span
                title={
                  'Killers — Guarda hasta 2 jugadas por nivel que causaron corte β.'
                  + '\nBeneficio: mejor ordering en ese ply.'
                  + '\nEjemplo: si merge X causa β-cut frecuentemente, se prueba antes.'
                }
              >
                Killers
              </span>
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={aiEnableHistory} onChange={onToggleAiEnableHistory} />
              <span
                title={
                  'History heuristic — Puntuación acumulada por jugada (por jugador).'
                  + '\nBeneficio: prioriza jugadas que históricamente fueron buenas.'
                  + '\nEjemplo: clave de history = jugador:moveKey (A+B), suma depth^2 en cortes.'
                }
              >
                History
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={aiEnableQuiescence} onChange={onToggleAiEnableQuiescence} />
                <span
                  title={
                    'Quiescence — Extiende hojas sólo en posiciones tácticas (cierre de ronda).'
                    + '\nBeneficio: reduce efecto horizonte sin perder exactitud.'
                    + '\nEjemplo: en d=0, si una fusión termina la ronda, se profundiza q plies.'
                  }
                >
                  Quiescence
                </span>
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={aiQuiescenceDepth}
                onChange={(e) => onChangeAiQuiescenceDepth(Math.max(1, Number(e.target.value) || 1))}
                style={{ width: 58 }}
                aria-label="Profundidad quiescence"
                title={'Profundidad adicional q para quiescence. Regla guía: 2–3. Más alto = más nodos en hojas.'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Análisis */}
      {activeTab === 'analysis' && (
        <div className="ia-panel__analysis" aria-label="Evaluación y análisis" style={{ marginTop: 8 }}>
          {/* Evaluación y PV */}
          <div className="ia-panel__evaluation" aria-label="Evaluación y PV" title={'Evaluación estática y PV (variación principal) de la última búsqueda.'}>
            <div className="eval">
              <div
                className="eval-bar"
                title={evalScore !== null && evalScore !== undefined ? `Eval para ${atRootLabel}: ${fmtScore(evalScore)}` : 'Sin datos'}
              >
                <div
                  className="eval-bar__fill"
                  style={{ width: `${(evalScore !== null && evalScore !== undefined ? ((normEval(evalScore) + 1) / 2) : 0) * 100}%` }}
                />
              </div>
              <span className="eval-value">
                {fmtScore(evalScore)}
              </span>
            </div>
            <div
              className="pv row info"
              title={'PV — Secuencia de jugadas óptimas encontradas. Útil para depurar decisiones.\n+Ejemplo: merge #a→#b → #c→#d …'}
            >
              PV {depthReached !== null ? `(d=${depthReached})` : ''}: {pv && pv.length ? pv.slice(0, 8).map(fmtMove).join(' → ') : 'NO INFO'}
            </div>
          </div>

          {/* KPIs */}
          <div className="ia-panel__kpis" aria-label="Métricas">
            <span className="kpi" title={'Nodos — Estados evaluados durante la última búsqueda. Ej.: 12,345 nodos.'}><strong>Nodos</strong> {(nodes || 0).toLocaleString()}</span>
            <span className="kpi" title={'Tiempo — Duración de la última búsqueda. Ej.: 0.85 s.'}><strong>Tiempo</strong> {((elapsedMs || 0) / 1000).toFixed(2)} s</span>
            <span className="kpi" title={'NPS — Nodes per second. Métrica de rendimiento. Ej.: 25,000 nps.'}><strong>NPS</strong> {Math.round(nps || 0).toLocaleString()}</span>
            <span className="kpi kpi--muted" title={'Turno en la raíz de búsqueda. Afecta el signo de la evaluación.'}><strong>Turno</strong> {current}</span>
          </div>

          {/* Top jugadas */}
          <div className="ia-panel__moves" aria-label="Top movimientos">
            <div className="section-title" title={'Top jugadas en la raíz: ranking por score. La barra indica magnitud relativa.'}>Top jugadas (raíz)</div>
            {(() => {
              const sorted = rootSorted;
              const filled = [...sorted];
              while (filled.length < 6) filled.push(undefined as any);
              const maxAbs = sorted.length > 0 ? Math.max(...sorted.map(r => Math.abs(r.score))) : 0;
              return (
                <ol className="moves-list">
                  {filled.map((r, i) => {
                    const has = !!r;
                    const label = has ? `${fmtMove(r!.move)} — ${fmtScore(r!.score)}` : 'NO INFO';
                    const ratio = has
                      ? (!Number.isFinite(r!.score)
                        ? 1
                        : (maxAbs > 0 && Number.isFinite(maxAbs) ? Math.min(1, Math.abs(r!.score) / maxAbs) : 0))
                      : 0;
                    return (
                      <li key={i} className="move-item">
                        <div className="mini-bar" aria-hidden="true">
                          <div className="mini-bar__fill" style={{ width: `${ratio * 100}%` }} />
                        </div>
                        <span className="move-label" title={'Jugada y su evaluación para el jugador al turno en raíz.'}>{label}</span>
                      </li>
                    );
                  })}
                </ol>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}

