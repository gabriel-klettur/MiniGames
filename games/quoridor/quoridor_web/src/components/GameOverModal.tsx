import type React from 'react';

export interface GameOverModalProps {
  message: string; // e.g., "Ganador: Claras (L) — razón"
  onConfirm: () => void; // acción del botón principal
}

/**
 * GameOverModal — Modal centrado para fin de partida en Quoridor.
 * - Enfocado a accesibilidad (aria, focus, teclado)
 * - Estilos Tailwind, coherentes con tema oscuro
 */
function GameOverModal({ message, onConfirm }: GameOverModalProps) {
  // Manejo básico de teclado: Enter/Escape confirman
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="presentation" aria-hidden={false}>
      {/* Backdrop que bloquea interacción debajo */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Contenedor centrado */}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
        <div
          className="w-[min(92vw,480px)] rounded-lg border border-white/10 bg-gray-900/90 p-5 shadow-xl backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="winner-title"
          aria-describedby="winner-desc"
          onKeyDown={onKeyDown}
        >
          <h3 id="winner-title" className="mb-2 text-lg font-semibold text-white">Partida terminada</h3>
          <p id="winner-desc" className="text-sm text-gray-100">{message}</p>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              autoFocus
              onClick={onConfirm}
              aria-label="Empezar otra partida"
            >
              Nueva partida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameOverModal;

