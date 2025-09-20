import type { GameState } from '../game/types';
import type { AIMove } from '../ia/moves';

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
  rootPlayer?: 'L' | 'D';
  moving?: boolean; // si hay animación de pieza en curso
}

export default function IAPanel(props: IAPanelProps) {
  const { state, depth, onChangeDepth, onAIMove, disabled, timeMode, timeSeconds, onChangeTimeMode, onChangeTimeSeconds, busy = false, progress = null,
    evalScore = null, depthReached = null, pv = [], rootMoves = [], nodes = 0, elapsedMs = 0, nps = 0, rootPlayer, moving = false } = props;
  const current = state.currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)';
  const atRootLabel = rootPlayer ? (rootPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)') : current;

  function normEval(v: number): number {
    // Normalizar a [-1, 1] usando tanh para estabilidad
    const scaled = Math.tanh(v / 25);
    return Math.max(-1, Math.min(1, scaled));
  }

  function fmtPos(p: { level: number; row: number; col: number }): string {
    return `L${p.level}:${p.row},${p.col}`;
  }
  function fmtMove(m: AIMove): string {
    if (m.kind === 'place') {
      const rec = m.recovers && m.recovers.length ? ` rec(${m.recovers.map(fmtPos).join(' ')})` : '';
      return `place ${fmtPos(m.dest)}${rec}`;
    }
    const rec = m.recovers && m.recovers.length ? ` rec(${m.recovers.map(fmtPos).join(' ')})` : '';
    return `lift ${fmtPos(m.src)}→${fmtPos(m.dest)}${rec}`;
  }

  return (
    <section className="panel small" aria-label="Panel de IA">
      <div className="row">
        <strong>IA</strong>
      </div>
      <div className="row">
        <label htmlFor="ia-depth">Profundidad:</label>
        <select
          id="ia-depth"
          value={depth}
          onChange={(e) => onChangeDepth(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="row">
        <label>Límite de tiempo:</label>
        <div className="segmented" role="group" aria-label="Modo de tiempo IA">
          <button
            className={timeMode === 'auto' ? 'active' : ''}
            onClick={() => onChangeTimeMode('auto')}
            aria-pressed={timeMode === 'auto'}
          >Auto</button>
          <button
            className={timeMode === 'manual' ? 'active' : ''}
            onClick={() => onChangeTimeMode('manual')}
            aria-pressed={timeMode === 'manual'}
          >Manual</button>
        </div>
      </div>
      {timeMode === 'manual' && (
        <div className="row" aria-label="Selector de tiempo manual">
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
          <span style={{ marginLeft: 8 }}>{timeSeconds.toFixed(1)} s</span>
        </div>
      )}
      {/* IA estado */}
      {(() => {
        const hasConclusion = !busy && evalScore !== null && evalScore !== undefined;
        const statusText = moving
          ? 'Moviendo Pieza'
          : busy
            ? (progress ? `Pensando… profundidad ${progress.depth}, eval ${progress.score.toFixed(1)}` : 'Pensando…')
            : (hasConclusion ? 'Conclusión:' : 'Sin acción');
        return (
          <div className="row" aria-live={busy ? 'polite' : undefined}>
            <strong>IA estado:</strong>&nbsp;<span>{statusText}</span>
          </div>
        );
      })()}

      {/* Conclusión: barra + PV (barra siempre visible; vacía si no hay info) */}
      <div className="row" aria-label="Evaluación y PV">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className="eval-bar"
            title={evalScore !== null && evalScore !== undefined ? `Eval para ${atRootLabel}: ${evalScore.toFixed(1)}` : 'Sin datos'}
          >
            <div
              className="eval-bar__fill"
              style={{ width: `${(evalScore !== null && evalScore !== undefined ? ((normEval(evalScore) + 1) / 2) : 0) * 100}%` }}
            />
          </div>
          <span style={{ minWidth: 70, textAlign: 'right' }}>
            {evalScore !== null && evalScore !== undefined ? (evalScore > 0 ? `+${evalScore.toFixed(1)}` : evalScore.toFixed(1)) : 'NO INFO'}
          </span>
        </div>
        <div className="row info">PV {depthReached !== null ? `(d=${depthReached})` : ''}: {pv && pv.length ? pv.slice(0, 8).map(fmtMove).join(' → ') : 'NO INFO'}</div>
      </div>

      <div className="row" aria-label="Top movimientos">
        <div><strong>Top jugadas (raíz)</strong></div>
        {(() => {
          const sorted = (rootMoves || [])
            .slice()
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);
          const filled = [...sorted];
          while (filled.length < 6) filled.push(undefined as any);
          const maxAbs = sorted.length > 0 ? Math.max(...sorted.map(r => Math.abs(r.score))) : 0;
          return (
            <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>
              {filled.map((r, i) => {
                const has = !!r;
                const label = has ? `${fmtMove(r!.move)} — ${r!.score > 0 ? `+${r!.score.toFixed(1)}` : r!.score.toFixed(1)}` : 'NO INFO';
                const ratio = has && maxAbs > 0 ? Math.min(1, Math.abs(r!.score) / maxAbs) : 0;
                return (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="mini-bar" aria-hidden="true">
                        <div className="mini-bar__fill" style={{ width: `${ratio * 100}%` }} />
                      </div>
                      <span>{label}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          );
        })()}
      </div>

      <div className="row info" aria-label="Métricas">
        Nodos: {(nodes || 0).toLocaleString()} · Tiempo: {((elapsedMs || 0) / 1000).toFixed(2)} s · NPS: {Math.round(nps || 0).toLocaleString()}
      </div>
      <div className="row">
        <span>Turno: {current}</span>
      </div>
      <div className="row actions">
        <button className="primary" onClick={onAIMove} disabled={disabled}>Mover IA</button>
      </div>
    </section>
  );
}
