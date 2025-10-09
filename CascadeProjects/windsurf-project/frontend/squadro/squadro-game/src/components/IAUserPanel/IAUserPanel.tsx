import './IAUserPanel.css';
import type { IAUserPanelProps } from './IAUserPanel.types.ts';
import DepthSelect from './DepthSelect.tsx';
import PlayerToggleButton from './PlayerToggleButton.tsx';
import RobotIcon from './RobotIcon.tsx';
import PresetsSelect from './PresetsSelect';

/**
 * IAUserPanel (Squadro): Presentational component mirroring Soluna's API.
 * Receives props from container (App) and renders difficulty + AI controls.
 */
export default function IAUserPanel(props: IAUserPanelProps) {
  const {
    depth,
    onChangeDepth,
    onAIMove,
    disabled = false,
    aiControlP1 = false,
    aiControlP2 = false,
    onToggleAiControlP1,
    onToggleAiControlP2,
    busy = false,
  } = props;

  return (
    <section className="panel small iauser-panel" aria-label="Controles de IA (usuario)">
      <div className="row actions iauser-inline" aria-label="Dificultad y acciones de IA">
        <div className="iauser-left" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DepthSelect depth={depth} onChangeDepth={onChangeDepth} />
          <PresetsSelect />
        </div>
        <div className="iauser-right">
          {/* Toggle IA controla P1 */}
          <PlayerToggleButton label="P1" active={aiControlP1} onClick={onToggleAiControlP1} />
          {/* Toggle IA controla P2 */}
          <PlayerToggleButton label="P2" active={aiControlP2} onClick={onToggleAiControlP2} />
          {/* Acción principal: Mover IA / Activar */}
          <button
            className={["ia-move-btn", busy ? "is-busy" : ""].join(" ")}
            onClick={onAIMove}
            disabled={disabled || busy}
            aria-pressed={busy}
          >
            <RobotIcon className="robot-icon" size={18} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}

