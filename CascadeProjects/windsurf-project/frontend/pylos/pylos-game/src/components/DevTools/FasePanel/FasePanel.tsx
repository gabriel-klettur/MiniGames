import type { GameState } from '../../../game/types';

export interface FasePanelProps {
  state: GameState;
  gameOverText?: string;
}

/**
 * FasePanel: muestra la fase actual y una breve descripción contextual.
 * Se usa dentro del Sidebar y se controla con el toggle "Dev".
 */
function FasePanel({ state, gameOverText }: FasePanelProps) {
  const { phase, recovery } = state;

  const info: string = (() => {
    if (gameOverText) return gameOverText;
    if (phase === 'recover') {
      const remaining = recovery?.remaining ?? 0;
      const minReq = recovery?.minRequired ?? 0;
      return `Recupera ${minReq > 0 ? `al menos ${minReq}` : 'hasta'} ${remaining} pieza(s).`;
    }
    if (phase === 'selectMoveDest') return 'Elige un destino válido para subir la pieza.';
    return 'Elige una casilla vacía para colocar o toca una pieza libre para moverla.';
  })();

  return (
    <div className="panel small" aria-label="Panel de fase">
      <div className="row"><strong>Fase:</strong> {phase}</div>
      <div className="row info">{info}</div>
    </div>
  );
}

export default FasePanel;
