import type React from 'react';

export interface GameOverModalProps {
  title?: string; // por defecto "Partida terminada"
  message: string; // e.g., "Ganador: Claras (L) — razón"
  onConfirm: () => void; // acción del botón principal
  buttonLabel?: string; // por defecto "Nueva partida"
  autoFocus?: boolean; // por defecto true (en simulación lo desactivamos)
}

/**
 * GameOverModal — Modal centrado para fin de ronda/partida (look & feel tipo Quoridor)
 * Implementado con las clases de estilo del proyecto (board-overlay, overlay-card, card, btn).
 */
function GameOverModal({ title = 'Partida terminada', message, onConfirm, buttonLabel = 'Nueva partida', autoFocus = true }: GameOverModalProps) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      onConfirm();
    }
  };

  return (
    <div className="board-overlay" role="presentation" aria-hidden={false}>
      <div
        className="overlay-card card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-title"
        aria-describedby="winner-desc"
        onKeyDown={onKeyDown}
        tabIndex={-1}
        style={{ maxWidth: 520, width: 'min(92vw, 520px)' }}
      >
        <div id="winner-title" style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
        <p id="winner-desc" style={{ margin: 0, opacity: 0.95 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button className="btn btn-success" autoFocus={autoFocus} onClick={onConfirm} aria-label={buttonLabel}>
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverModal;

