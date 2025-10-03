import type { IAUserPanelProps } from './IAUserPanel.types';
import './IAUserPanel.css';
import DepthSelect from './DepthSelect';
import PlayerToggleButton from './PlayerToggleButton';
import RobotIcon from './RobotIcon';

/**
 * IAUserPanel (Soluna): Controles principales de IA para el usuario (Mover IA,
 * dificultad) colocados bajo el Header. La configuración de tiempo se deja
 * para un panel avanzado (DevTools IAPanel) si se desea.
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
        <DepthSelect depth={depth} onChangeDepth={onChangeDepth} />
        <div className="iauser-right">
          {/* Toggle IA controla P1 */}
          <PlayerToggleButton label="P1" active={aiControlP1} onClick={onToggleAiControlP1} />
          {/* Toggle IA controla P2 */}
          <PlayerToggleButton label="P2" active={aiControlP2} onClick={onToggleAiControlP2} />
          {/* Acción principal: Mover IA */}
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
