import type { GameState } from '../game/types';
import type { MutableRefObject, RefObject } from 'react';
import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';

export interface InfoPanelProps {
  state: GameState;
  /**
   * If playing vs AI, which side is controlled by the AI (enemy). Null otherwise.
   */
  aiEnemy?: 'L' | 'D' | null;
  /**
   * If the last move was performed by the AI (manual assist or vs AI), which side moved.
   * Null otherwise.
   */
  aiLastMove?: 'L' | 'D' | null;
  /**
   * Optional override for reserves to support optimistic UI during animations
   * (e.g., decrement when placing from reserve, increment when recovering)
   */
  reservesOverride?: GameState['reserves'];
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
 * Botones contextuales se gestionan fuera de este panel.
 */
function InfoPanel({ state, aiEnemy = null, aiLastMove = null, reservesOverride, currentPieceRef, reserveLightRef, reserveDarkRef }: InfoPanelProps) {
  const { currentPlayer, reserves } = state;
  const reservesDisplay = reservesOverride ?? reserves;
  const showEnemyL = aiEnemy === 'L';
  const showEnemyD = aiEnemy === 'D';
  const showMoveL = aiLastMove === 'L';
  const showMoveD = aiLastMove === 'D';

  return (
    <section className="info-panel" aria-label="Panel de información y acciones">
      <div className="row grid-3">
        <div>
          {(showEnemyL || showMoveL) && (
            <svg className={["robot-icon", showMoveL ? 'is-active' : 'is-passive'].join(' ')} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
          )}
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
              src={bolaB}
              alt="Claras (L)"
              className="piece__img"
              draggable={false}
            />
          </span>
          <span className="reserve-count">{reservesDisplay.L}</span>
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
              src={currentPlayer === 'L' ? bolaB : bolaA}
              alt={currentPlayer === 'L' ? 'Claras (L)' : 'Oscuras (D)'}
              className="piece__img"
              draggable={false}
            />
          </span>
        </div>
        <div>
          {(showEnemyD || showMoveD) && (
            <svg className={["robot-icon", showMoveD ? 'is-active' : 'is-passive'].join(' ')} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
          )}
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
              src={bolaA}
              alt="Oscuras (D)"
              className="piece__img"
              draggable={false}
            />
          </span>
          <span className="reserve-count">{reservesDisplay.D}</span>
        </div>
      </div>
    </section>
  );
}

export default InfoPanel;

