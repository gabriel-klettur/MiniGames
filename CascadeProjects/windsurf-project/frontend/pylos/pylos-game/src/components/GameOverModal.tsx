export interface GameOverModalProps {
  message: string; // e.g., "Ganador: Claras (L) — razon"
  onConfirm: () => void; // action for the OK button
}

/**
 * GameOverModal: simple centered modal to show game-over status and winner.
 * Blocks interaction below via backdrop; keyboard accessible.
 */
function GameOverModal({ message, onConfirm }: GameOverModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" aria-hidden={false}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gameover-title"
        aria-describedby="gameover-desc"
      >
        <h3 id="gameover-title" className="modal__title">Fin de la partida</h3>
        <p id="gameover-desc" className="modal__message">{message}</p>
        <div className="modal__actions">
          <button className="primary" autoFocus onClick={onConfirm} aria-label="Empezar otra partida">
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverModal;
