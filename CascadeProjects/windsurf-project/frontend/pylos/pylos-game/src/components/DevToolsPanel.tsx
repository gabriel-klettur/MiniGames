 

export interface DevToolsPanelProps {
  onToggleBoardMode: () => void;
  onToggleRules: () => void;
  boardMode?: 'pyramid' | 'stacked';
  className?: string;
  debugOn?: boolean;
  onToggleDebug?: () => void;
}

/**
 * DevToolsPanel: agrupa acciones de desarrollo/diagnóstico.
 * Presentacional; delega callbacks al contenedor.
 */
function DevToolsPanel({ onToggleBoardMode, onToggleRules, boardMode, className, debugOn, onToggleDebug }: DevToolsPanelProps) {
  return (
    <div className={["panel", className ?? ""].join(" ").trim()}>
      <div className="row actions">
        <button onClick={onToggleBoardMode} title={`Cambiar vista de tablero (actual: ${boardMode ?? 'pyramid'})`}>
          Tablero
        </button>
        <button onClick={onToggleRules}>Reglas</button>
        <button onClick={onToggleDebug} aria-pressed={!!debugOn} title="Debug hit-test">
          HitTest
        </button>
      </div>
    </div>
  );
}

export default DevToolsPanel;
