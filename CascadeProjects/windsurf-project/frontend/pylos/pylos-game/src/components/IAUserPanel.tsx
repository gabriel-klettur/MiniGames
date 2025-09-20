import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';

export interface IAUserPanelProps {
  depth: number; // 1..10
  onChangeDepth: (d: number) => void;
  onAIMove: () => void;
  disabled?: boolean;
  timeMode: 'auto' | 'manual';
  timeSeconds: number; // 0..30
  onChangeTimeMode: (m: 'auto' | 'manual') => void;
  onChangeTimeSeconds: (secs: number) => void;
  /** Color para el que la IA jugará automáticamente; null si desactivado */
  autoFor?: 'L' | 'D' | null;
  /** Alternar el modo auto para un color específico */
  onToggleAutoFor?: (p: 'L' | 'D') => void;
}

/**
 * IAUserPanel: Controles principales de IA para el usuario (Mover IA,
 * profundidad y límite de tiempo) colocados bajo el Header.
 * Compacto y centrado, reutiliza estilos del sistema (panel, segmented, etc.).
 */
export default function IAUserPanel(props: IAUserPanelProps) {
  const {
    depth,
    onChangeDepth,
    onAIMove,
    disabled = false,
    timeMode,
    timeSeconds,
    onChangeTimeMode,
    onChangeTimeSeconds,
    autoFor = null,
    onToggleAutoFor = () => {},
  } = props;

  return (
    <section className="panel small iauser-panel" aria-label="Controles de IA (usuario)">
      <div className="row" aria-label="Dificultad de IA">
        <label htmlFor="iauser-depth">Dificultad:</label>
        <select
          id="iauser-depth"
          value={depth}
          onChange={(e) => onChangeDepth(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="row" aria-label="Modo de tiempo de la IA">
        <label>Límite de tiempo pensamiento IA:</label>
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

      <div className="row actions">
        <button className="primary" onClick={onAIMove} disabled={disabled}>Mover IA</button>
        <button
          onClick={() => onToggleAutoFor('L')}
          disabled={disabled}
          aria-pressed={autoFor === 'L'}
          aria-label="Partida IA (Claras)"
          title="Partida IA (Claras)"
        >
          <img className="iauser-btn__icon" src={bolaA} alt="" aria-hidden="true" />
          <span className="iauser-btn__label">Partida IA</span>
        </button>
        <button
          onClick={() => onToggleAutoFor('D')}
          disabled={disabled}
          aria-pressed={autoFor === 'D'}
          aria-label="Partida IA (Oscuras)"
          title="Partida IA (Oscuras)"
        >
          <img className="iauser-btn__icon" src={bolaB} alt="" aria-hidden="true" />
          <span className="iauser-btn__label">Partida IA</span>
        </button>
      </div>
    </section>
  );
}
