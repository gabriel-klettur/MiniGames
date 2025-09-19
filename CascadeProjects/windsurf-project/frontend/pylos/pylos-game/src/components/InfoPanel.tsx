import type { GameState } from '../game/types';
import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';

export interface InfoPanelProps {
  state: GameState;
  onFinishRecovery: () => void;
  gameOverText?: string;
}

/**
 * InfoPanel: muestra estado general (turno, reservas, fase) y acciones contextuales.
 * El botón "Terminar recuperación" sólo aparece cuando la fase es 'recover'.
 */
function InfoPanel({ state, onFinishRecovery, gameOverText }: InfoPanelProps) {
  const { currentPlayer, reserves, phase, recovery } = state;

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
    <section className="info-panel" aria-label="Panel de información y acciones">
      <div className="row grid-3">
        <div>
          <strong>Turno:</strong>{' '}
          <span
            className={[
              'piece',
              currentPlayer === 'L' ? 'piece--light' : 'piece--dark',
            ].join(' ')}
            title={currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
            aria-label={currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
          >
            <img
              src={currentPlayer === 'L' ? bolaA : bolaB}
              alt={currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
              className="piece__img"
              draggable={false}
            />
          </span>
        </div>
        <div>
          <span
            className={[
              'piece',
              'piece--light',
            ].join(' ')}
            title="Claras (L) en reserva"
            aria-label="Claras (L) en reserva"
          >
            <img
              src={bolaA}
              alt="Claras (L)"
              className="piece__img"
              draggable={false}
            />
          </span>
          <span className="reserve-count">{reserves.L}</span>
        </div>
        <div>
          <span
            className={[
              'piece',
              'piece--dark',
            ].join(' ')}
            title="Oscuras (D) en reserva"
            aria-label="Oscuras (D) en reserva"
          >
            <img
              src={bolaB}
              alt="Oscuras (D)"
              className="piece__img"
              draggable={false}
            />
          </span>
          <span className="reserve-count">{reserves.D}</span>
        </div>
      </div>
      <div className="row"><strong>Fase:</strong> {phase}</div>
      <div className="row info">{info}</div>
      {phase === 'recover' && (
        <div className="row actions">
          <button onClick={onFinishRecovery} className="primary">Terminar recuperación</button>
        </div>
      )}
    </section>
  );
}

export default InfoPanel;
