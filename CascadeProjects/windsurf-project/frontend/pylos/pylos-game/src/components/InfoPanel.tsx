import type { GameState } from '../game/types';
import type { MutableRefObject, RefObject } from 'react';
import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';

export interface InfoPanelProps {
  state: GameState;
  onFinishRecovery: () => void;
  /**
   * Ref to the current player's piece icon in the center, used to measure
   * screen position for the flying animation from panel to board.
   */
  currentPieceRef?: MutableRefObject<HTMLSpanElement | null> | RefObject<HTMLSpanElement>;
  /**
   * Refs to each player's reserve piece icon (left/right), used as animation origins.
   */
  reserveLightRef?: MutableRefObject<HTMLSpanElement | null> | RefObject<HTMLSpanElement>;
  reserveDarkRef?: MutableRefObject<HTMLSpanElement | null> | RefObject<HTMLSpanElement>;
}

/**
 * InfoPanel: muestra estado general (turno, reservas, fase) y acciones contextuales.
 * El botón "Terminar recuperación" sólo aparece cuando la fase es 'recover'.
 */
function InfoPanel({ state, onFinishRecovery, currentPieceRef, reserveLightRef, reserveDarkRef }: InfoPanelProps) {
  const { currentPlayer, reserves, phase } = state;

  return (
    <section className="info-panel" aria-label="Panel de información y acciones">
      <div className="row grid-3">
        <div>
          <span
            className={[
              'piece',
              'piece--dark',
            ].join(' ')}
            title="Oscuras (D) en reserva"
            aria-label="Oscuras (D) en reserva"
            ref={reserveDarkRef ?? undefined}
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
        <div>
          <strong></strong>{' '}
          <span
            className={[
              'piece',
              currentPlayer === 'L' ? 'piece--light' : 'piece--dark',
              'piece--current',
            ].join(' ')}
            title={currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
            aria-label={currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
            ref={currentPieceRef ?? undefined}
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
            ref={reserveLightRef ?? undefined}
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
      </div>
      {phase === 'recover' && (
        <div className="row actions">
          <button onClick={onFinishRecovery} className="primary">Terminar recuperación</button>
        </div>
      )}
    </section>
  );
}

export default InfoPanel;

