 import type { ReactNode } from 'react';

export interface DevToolsPanelProps {
  onToggleBoardMode: () => void;
  onToggleRules: () => void;
  boardMode?: 'pyramid' | 'stacked';
  className?: string;
  debugOn?: boolean;
  onToggleDebug?: () => void;
  // Colapsable de IA dentro del DevTools
  showIA?: boolean;
  onToggleIA?: () => void;
  iaPanel?: ReactNode;
  // Toggle de historial de movimientos
  showHistory?: boolean;
  onToggleHistory?: () => void;
  // Forzar ocupar todo el ancho disponible
  fullWidth?: boolean;
  // Toggle del panel de fases
  showFases?: boolean;
  onToggleFases?: () => void;
}

/**
 * DevToolsPanel: agrupa acciones de desarrollo/diagnóstico.
 * Presentacional; delega callbacks al contenedor.
 */
function DevToolsPanel({ onToggleBoardMode, onToggleRules, boardMode, className, debugOn, onToggleDebug, showIA = false, onToggleIA = () => {}, iaPanel, showHistory = false, onToggleHistory = () => {}, fullWidth = false, showFases = true, onToggleFases = () => {} }: DevToolsPanelProps) {
  const wrapperClass = [
    'panel',
    'devtools-panel',
    className ?? '',
    fullWidth ? 'is-fullwidth' : '',
  ].join(' ').trim();

  return (
    <div className={wrapperClass}>
      <div className="row actions devtools-actions">
        <button className="devtools-btn" onClick={onToggleBoardMode} title={`Cambiar vista de tablero (actual: ${boardMode ?? 'pyramid'})`}>
          <svg className="devtools-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>
          <span className="devtools-btn__label">Tablero</span>
        </button>
        <button className="devtools-btn" onClick={onToggleRules} title="Reglas del juego">
          <svg className="devtools-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 4h11a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.8.4L16 18H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
          <span className="devtools-btn__label">Reglas</span>
        </button>
        <button className="devtools-btn" onClick={onToggleFases} aria-pressed={!!showFases} title="Mostrar/Ocultar panel de fases">
          <svg className="devtools-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 7h16v2H4V7zm0 4h12v2H4v-2zm0 4h8v2H4v-2z"/></svg>
          <span className="devtools-btn__label">Fases</span>
        </button>
        <button className="devtools-btn" onClick={onToggleHistory} aria-pressed={!!showHistory} title="Mostrar/Ocultar historial de jugadas">
          <svg className="devtools-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h13v2H4v-2z"/></svg>
          <span className="devtools-btn__label">Historial</span>
        </button>
        <button className="devtools-btn" onClick={onToggleDebug} aria-pressed={!!debugOn} title="Debug hit-test">
          <svg className="devtools-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a1 1 0 0 1 1 1v2.06a7.002 7.002 0 0 1 5.94 5.94H21a1 1 0 1 1 0 2h-2.06A7.002 7.002 0 0 1 13 18.94V21a1 1 0 1 1-2 0v-2.06A7.002 7.002 0 0 1 5.06 13H3a1 1 0 1 1 0-2h2.06A7.002 7.002 0 0 1 11 5.06V3a1 1 0 0 1 1-1Zm0 6a4 4 0 1 0 .001 8.001A4 4 0 0 0 12 8Z"/></svg>
          <span className="devtools-btn__label">HitTest</span>
        </button>
        <button className="devtools-btn" onClick={onToggleIA} aria-pressed={!!showIA} title="Alternar panel de IA">
          <svg className="devtools-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3c4.97 0 9 3.58 9 8 0 4.42-4.03 8-9 8-.69 0-1.36-.07-2-.2L7 21l.65-2.28C6.06 17.51 5 15.86 5 14c0-4.42 4.03-8 9-8Z"/></svg>
          <span className="devtools-btn__label">IA {showIA ? '▾' : '▸'}</span>
        </button>
      </div>
      {showIA && iaPanel && (
        <div className="row devtools-section">
          {iaPanel}
        </div>
      )}
    </div>
  );
}

export default DevToolsPanel;
