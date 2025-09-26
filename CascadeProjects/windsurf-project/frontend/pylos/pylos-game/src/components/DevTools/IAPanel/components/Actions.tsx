export interface ActionsProps {
  onAIMove: () => void;
  disabled?: boolean;
  aiAutoplayActive?: boolean;
  onToggleAiAutoplay?: () => void;
}

export default function Actions({ onAIMove, disabled = false, aiAutoplayActive = false, onToggleAiAutoplay }: ActionsProps) {
  return (
    <div className="ia-panel__actions">
      <button
        className="primary"
        onClick={onAIMove}
        disabled={disabled}
        aria-label="Mover IA"
        title="Mover IA"
      >
        <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M11 2h2v3h-2z"/>
          <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
          <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
          <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
          <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
        </svg>
        <span className="sr-only">Mover IA</span>
      </button>
      <button
        onClick={onToggleAiAutoplay}
        aria-pressed={aiAutoplayActive}
        disabled={disabled && !aiAutoplayActive}
        title={aiAutoplayActive ? 'Detener autoplay de la IA' : 'Iniciar autoplay de la IA'}
        aria-label={aiAutoplayActive ? 'Detener autoplay de la IA' : 'Iniciar autoplay de la IA'}
      >
        {aiAutoplayActive ? (
          // Stop (square)
          <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M6 6h12v12H6z" />
          </svg>
        ) : (
          // Play (triangle)
          <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M8 5v14l11-7z" />
          </svg>
        )}
        <span className="sr-only">{aiAutoplayActive ? 'Detener autoplay de la IA' : 'Iniciar autoplay de la IA'}</span>
      </button>
    </div>
  );
}

