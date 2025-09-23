import { useState } from 'react';
import { useGame } from '../../game/store';

export interface DevToolsPanelProps {
  className?: string;
  showFases?: boolean;
  onToggleFases?: () => void;
  showUX?: boolean;
  onToggleUX?: () => void;
  onToggleRules?: () => void;
}

// DevToolsPanel — Acciones de desarrollo/diagnóstico (presentacional), estilo Quoridor
export default function DevToolsPanel({
  className,
  showFases = false,
  onToggleFases = () => {},
  showUX = false,
  onToggleUX = () => {},
  onToggleRules = () => {},
}: DevToolsPanelProps) {
  const { dispatch } = useGame();
  const [showState, setShowState] = useState(false);
  return (
    <div className={["devtools-panel", className ?? ""].join(" ").trim()}>
      <div className="devtools-header">DevTools</div>
      <div className="devtools-actions">
        <button className="btn btn-secondary" onClick={onToggleRules}>Reglas</button>
        <button
          className={`btn ${showFases ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={showFases}
          onClick={onToggleFases}
        >
          Fases
        </button>
        <button
          className={`btn ${showUX ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={showUX}
          onClick={onToggleUX}
        >
          UI/UX
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'new-round' })}>Nueva ronda</button>
        <button className="btn btn-secondary" onClick={() => dispatch({ type: 'reset-game' })}>Reset juego</button>
        <label className="toggle">
          <input type="checkbox" checked={showState} onChange={(e) => setShowState(e.target.checked)} /> Mostrar estado
        </label>
      </div>
      {showState && (
        <pre className="devtools-pre">{/* Estado reducido para inspección rápida desde GameContext */}
{JSON.stringify({ /* Nota: evita mostrar datos sensibles */}, null, 2)}
        </pre>
      )}
    </div>
  );
}

