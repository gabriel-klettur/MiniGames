export interface HeaderPanelProps {
  title?: string;
  onNewGame: () => void;
  showTools: boolean;
  onToggleDev: () => void;
  // IA toggle button (placed to the left of 'Dev')
  showIA?: boolean;
  onToggleIA?: () => void;
  // Control para ocultar el botón IA en el header
  showIAToggle?: boolean;
  // Control para ocultar el botón Dev en el header
  showDevToggle?: boolean;
}

/**
 * HeaderPanel: muestra el nombre del juego y acciones principales (Nuevo, Dev).
 * Se piensa para el Sidebar y busca ser compacto en altura.
 */
function HeaderPanel({ title = 'Pylos', onNewGame, showTools, onToggleDev, showIA = false, onToggleIA = () => {}, showIAToggle = true, showDevToggle = true }: HeaderPanelProps) {
  return (
    <section className="header-bar" aria-label="Encabezado">
      <div className="row header">
        <h2>{title}</h2>
        <div className="header-actions">
          <button onClick={onNewGame} aria-label="Nueva partida" title="Nueva partida">
            {/* plus icon */}
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z"/></svg>
            <span className="sr-only">Nueva partida</span>
          </button>
          {showIAToggle && (
            <button
              onClick={onToggleIA}
              aria-pressed={showIA}
              aria-label="Alternar panel de IA"
              title="IA"
            >
              <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 4a7 7 0 0 1 7 7c0 .69-.1 1.36-.3 2h1.8a1 1 0 1 1 0 2h-2.5a7.01 7.01 0 0 1-4.5 3.9V21a1 1 0 1 1-2 0v-2.1A7.01 7.01 0 0 1 6 15H3.5a1 1 0 1 1 0-2H5.3c-.2-.64-.3-1.31-.3-2a7 7 0 0 1 7-7Z"/></svg>
              <span className="header-btn__label">IA</span>
            </button>
          )}
          {showDevToggle && (
            <button
              onClick={onToggleDev}
              aria-pressed={showTools}
              aria-label="Alternar controles de desarrollo"
              title="Dev"
            >
              <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.88 7.88 0 0 0-1.7-.98l-.38-2.65A.5.5 0 0 0 13 1h-4a.5.5 0 0 0-.49.42l-.38 2.65c-.6.24-1.17.56-1.7.98l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L3.57 11c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.13.22.38.31.6.22l2.49-1c.53.42 1.1.74 1.7.98l.38 2.65c.04.24.25.42.49.42h4c.24 0 .45-.18.49-.42l.38-2.65c.6-.24 1.17-.56 1.7-.98l2.49 1c.22.09.47 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64L19.43 12.98Z" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
              <span className="header-btn__label">Dev</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default HeaderPanel;

