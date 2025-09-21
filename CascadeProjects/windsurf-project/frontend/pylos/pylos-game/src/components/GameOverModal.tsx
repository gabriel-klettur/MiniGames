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
    <div className="modal-backdrop winner-backdrop" role="presentation" aria-hidden={false}>
      <div
        className="modal winner-modal"
        role="dialog"
        aria-modal="true"
        aria-describedby="winner-desc"
      >
        <p id="winner-desc" className="modal__message">{message}</p>
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
