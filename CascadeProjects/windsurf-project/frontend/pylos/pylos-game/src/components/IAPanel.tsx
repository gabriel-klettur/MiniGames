import type { GameState } from '../game/types';

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
}

export default function IAPanel({ state, depth, onChangeDepth, onAIMove, disabled, timeMode, timeSeconds, onChangeTimeMode, onChangeTimeSeconds }: IAPanelProps) {
  const current = state.currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)';
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
      <div className="row">
        <span>Turno: {current}</span>
      </div>
      <div className="row actions">
        <button className="primary" onClick={onAIMove} disabled={disabled}>Mover IA</button>
      </div>
    </section>
  );
}
