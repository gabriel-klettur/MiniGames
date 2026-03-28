export interface FootPanelProps {
  showTools: boolean;
  onToggleDev: () => void;
}

/**
 * FootPanel: botón flotante (esquina inferior derecha) para alternar DevTools.
 * Mantiene el header limpio y hace el toggle accesible en todo momento.
 */
export default function FootPanel({ showTools, onToggleDev }: FootPanelProps) {
  return (
    <div className="foot-panel" role="region" aria-label="Acceso rápido a DevTools">
      <button
        className={["foot-panel__btn", showTools ? 'is-active' : ''].join(' ').trim()}
        onClick={onToggleDev}
        aria-pressed={showTools}
        aria-label="Alternar controles de desarrollo"
        title="Dev"
      >
        {/* Gear icon */}
        <svg
          className="foot-panel__icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.88 7.88 0 0 0-1.7-.98l-.38-2.65A.5.5 0 0 0 13 1h-4a.5.5 0 0 0-.49.42l-.38 2.65c-.6.24-1.17.56-1.7.98l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L3.57 11c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.13.22.38.31.6.22l2.49-1c.53.42 1.1.74 1.7.98l.38 2.65c.04.24.25.42.49.42h4c.24 0 .45-.18.49-.42l.38-2.65c.6-.24 1.17-.56 1.7-.98l2.49 1c.22.09.47 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64L19.43 12.98Z"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
            opacity="0.9"
          />
        </svg>
        <span className="foot-panel__label">Dev</span>
      </button>
    </div>
  );
}
