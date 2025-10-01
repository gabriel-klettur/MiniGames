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
   * Whether the AI is currently thinking. Used to blink the robot icon subtly.
   */
  aiThinking?: boolean;
  /**
   * Preferred indicator of which side is currently being thought by the AI.
   * If provided, overrides aiEnemy for blinking purposes.
   */
  aiThinkingSide?: 'L' | 'D' | null;
  /**
   * Immediate AI control toggles per side (from IAUserPanel). When true, the
   * InfoPanel should show the robot icon for that side immediately, without
   * waiting for a move to be made.
   */
  aiControlL?: boolean;
  aiControlD?: boolean;
  /**
   * Last actor who moved for each side (ai/human). If undefined, defaults to human.
   */
  lastActorL?: 'ai' | 'human';
  lastActorD?: 'ai' | 'human';
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
function InfoPanel({ state, aiEnemy = null, aiThinking = false, aiThinkingSide = null, aiControlL = false, aiControlD = false, reservesOverride, currentPieceRef, reserveLightRef, reserveDarkRef }: InfoPanelProps) {
  const { currentPlayer, reserves } = state;
  const reservesDisplay = reservesOverride ?? reserves;
  const effectiveThinkSide = aiThinking ? (aiThinkingSide ?? aiEnemy ?? null) : null;
  const thinkL = aiThinking && effectiveThinkSide === 'L';
  const thinkD = aiThinking && effectiveThinkSide === 'D';
  // Show robot if the side is currently controlled by AI (Vs AI or IAUserPanel toggle),
  // or if AI is currently thinking for that side. This ensures immediate UI feedback
  // when toggling control on/off, independent of who moved last.
  const controlledByAIL = aiControlL || aiEnemy === 'L';
  const controlledByAID = aiControlD || aiEnemy === 'D';
  const robotL = controlledByAIL || thinkL;
  const robotD = controlledByAID || thinkD;

  return (
    <section className="info-panel" aria-label="Panel de información y acciones">
      <div className="row grid-3">
        <div>
          {robotL && (
            <svg className={["robot-icon", 'is-active', thinkL ? 'is-thinking' : ''].join(' ')} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
          )}
          {!robotL && (
            <svg className={['human-icon'].join(' ')} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              {/* Simple human: head + shoulders silhouette */}
              <circle cx="12" cy="7" r="3" fill="currentColor" />
              <path d="M6 20v-2c0-2.8 2.7-5 6-5s6 2.2 6 5v2H6z" fill="currentColor" />
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
          {robotD && (
            <svg className={["robot-icon", 'is-active', thinkD ? 'is-thinking' : ''].join(' ')} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 2h2v3h-2z"/>
              <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
              <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
              <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
              <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
            </svg>
          )}
          {!robotD && (
            <svg className={['human-icon'].join(' ')} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              {/* Simple human: head + shoulders silhouette */}
              <circle cx="12" cy="7" r="3" fill="currentColor" />
              <path d="M6 20v-2c0-2.8 2.7-5 6-5s6 2.2 6 5v2H6z" fill="currentColor" />
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

