import { useTimeBudget } from '../hooks/useTimeBudget';
import TimeBar from './TimeBar';

export interface ControlSectionProps {
  depth: number;
  onChangeDepth: (d: number) => void;
  timeMode: 'auto' | 'manual';
  timeSeconds: number;
  onChangeTimeMode: (m: 'auto' | 'manual') => void;
  onChangeTimeSeconds: (secs: number) => void;
  busy: boolean;
  progress: { depth: number; score: number } | null;
  disabled?: boolean;
  onAIMove: () => void;
  elapsedMs: number;
  busyElapsedMs?: number;
  // Engine flags & params
  aiEnableTT: boolean; onToggleAiEnableTT: () => void;
  aiFailSoft: boolean; onToggleAiFailSoft: () => void;
  aiPreferHashMove: boolean; onToggleAiPreferHashMove: () => void;
  aiEnablePVS: boolean; onToggleAiEnablePVS: () => void;
  aiEnableAspiration: boolean; onToggleAiEnableAspiration: () => void;
  aiAspirationDelta: number; onChangeAiAspirationDelta: (n: number) => void;
  aiEnableKillers: boolean; onToggleAiEnableKillers: () => void;
  aiEnableHistory: boolean; onToggleAiEnableHistory: () => void;
  aiEnableQuiescence: boolean; onToggleAiEnableQuiescence: () => void;
  aiQuiescenceDepth: number; onChangeAiQuiescenceDepth: (n: number) => void;
  // Optional: quiescence high-tower threshold control
  aiQuiescenceHighTowerThreshold?: number;
  onChangeAiQuiescenceHighTowerThreshold?: (n: number) => void;
  // Optional: adaptive time config (auto mode)
  aiTimeMinMs?: number; onChangeAiTimeMinMs?: (n: number) => void;
  aiTimeMaxMs?: number; onChangeAiTimeMaxMs?: (n: number) => void;
  aiTimeBaseMs?: number; onChangeAiTimeBaseMs?: (n: number) => void;
  aiTimePerMoveMs?: number; onChangeAiTimePerMoveMs?: (n: number) => void;
  aiTimeExponent?: number; onChangeAiTimeExponent?: (n: number) => void;
}

export default function ControlSection(props: ControlSectionProps) {
  const {
    depth, onChangeDepth,
    timeMode, timeSeconds, onChangeTimeMode, onChangeTimeSeconds,
    busy, progress, disabled, onAIMove,
    elapsedMs, busyElapsedMs,
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
  } = props;

  const { limitMs, shownElapsedMs, ratio, isOver } = useTimeBudget({
    timeMode, timeSeconds, busy, elapsedMs, busyElapsedMs,
  });

  return (
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
            title={'Tiempo objetivo por jugada (segundos). Ej.: 2.5 s. ' +
              'Afecta iterative deepening: profundiza hasta agotar el presupuesto.'}
          />
          <span className="range-value">{timeSeconds.toFixed(1)} s</span>
        </div>
      )}

      {/* Barra de tiempo visual */}
      {timeMode === 'manual' && (
        <TimeBar limitMs={limitMs} shownElapsedMs={shownElapsedMs} ratio={ratio} isOver={isOver} />
      )}

      {/* Adaptive time (auto) advanced config, shown only if provided and in auto mode */}
      {timeMode === 'auto' && typeof aiTimeMinMs === 'number' && (
        <div className="ia-panel__advanced" style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          <label title="Tiempo mínimo por jugada (ms)">
            min
            <input type="number" value={aiTimeMinMs} onChange={(e) => onChangeAiTimeMinMs && onChangeAiTimeMinMs(Math.max(0, Number(e.target.value) || 0))} style={{ width: '100%' }} />
          </label>
          <label title="Tiempo máximo por jugada (ms)">
            max
            <input type="number" value={aiTimeMaxMs} onChange={(e) => onChangeAiTimeMaxMs && onChangeAiTimeMaxMs(Math.max(0, Number(e.target.value) || 0))} style={{ width: '100%' }} />
          </label>
          <label title="Tiempo base independiente del branching (ms)">
            base
            <input type="number" value={aiTimeBaseMs} onChange={(e) => onChangeAiTimeBaseMs && onChangeAiTimeBaseMs(Math.max(0, Number(e.target.value) || 0))} style={{ width: '100%' }} />
          </label>
          <label title="Multiplicador por movimiento raíz (ms)">
            perMove
            <input type="number" value={aiTimePerMoveMs} onChange={(e) => onChangeAiTimePerMoveMs && onChangeAiTimePerMoveMs(Number(e.target.value) || 0)} style={{ width: '100%' }} />
          </label>
          <label title="Exponente aplicado al branching factor">
            exp
            <input type="number" step={0.1} value={aiTimeExponent ?? 1} onChange={(e) => onChangeAiTimeExponent && onChangeAiTimeExponent(Number(e.target.value) || 1)} style={{ width: '100%' }} />
          </label>
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
                Pensando{progress?.depth ? ` d${progress.depth}` : ''}{typeof busyElapsedMs === 'number' ? ` · ${(busyElapsedMs / 1000).toFixed(1)}s` : ''}
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
      </div>

      {/* Ajustes del motor IA */}
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
            title={'Fail-soft — En cortes devuelve el valor real del hijo (no sólo α/β).' +
              '\nBeneficio: mejores ventanas en iteraciones siguientes y ranking raíz.' +
              '\nEjemplo: si hijo=+37 supera β=+30, se guarda +37 (no +30).'}
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
            title={'PVS — Principal Variation Search: primer hijo ventana completa, resto ventana nula.' +
              '\nBeneficio: reduce nodos manteniendo exactitud.' +
              '\nEjemplo: tras buen ordering, muchos hijos fallan rápido con [α, α+1].'}
          >
            PVS
          </span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={aiEnableAspiration} onChange={onToggleAiEnableAspiration} />
            <span
              title={'Aspiration Windows — Busca alrededor del score previo y reintenta si falla.' +
                '\nBeneficio: ventanas estrechas aceleran la poda.' +
                '\nEjemplo: score previo +40 → ventana [+30,+50]. Si falla, amplía a completa.'}
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
            title={'Killers — Guarda hasta 2 jugadas por nivel que causaron corte β.' +
              '\nBeneficio: mejor ordering en ese ply.' +
              '\nEjemplo: si merge X causa β-cut frecuentemente, se prueba antes.'}
          >
            Killers
          </span>
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={aiEnableHistory} onChange={onToggleAiEnableHistory} />
          <span
            title={'History heuristic — Puntuación acumulada por jugada (por jugador).' +
              '\nBeneficio: prioriza jugadas que históricamente fueron buenas.' +
              '\nEjemplo: clave de history = jugador:moveKey (A+B), suma depth^2 en cortes.'}
          >
            History
          </span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={aiEnableQuiescence} onChange={onToggleAiEnableQuiescence} />
            <span
              title={'Quiescence — Extiende hojas sólo en posiciones tácticas (cierre de ronda).' +
                '\nBeneficio: reduce efecto horizonte sin perder exactitud.' +
                '\nEjemplo: en d=0, si una fusión termina la ronda, se profundiza q plies.'}
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
          {typeof aiQuiescenceHighTowerThreshold === 'number' && (
            <input
              type="number"
              min={2}
              step={1}
              value={aiQuiescenceHighTowerThreshold}
              onChange={(e) => onChangeAiQuiescenceHighTowerThreshold && onChangeAiQuiescenceHighTowerThreshold(Math.max(2, Number(e.target.value) || 2))}
              style={{ width: 58 }}
              aria-label="Umbral torre alta (quiescence)"
              title={'Umbral de altura para considerar táctica una fusión que genera torre alta. Ej.: >=5.'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
