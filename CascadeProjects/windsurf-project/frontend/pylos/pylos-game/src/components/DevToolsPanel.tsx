 import type { ReactNode } from 'react';

export interface DevToolsPanelProps {
  onToggleRules: () => void;
  className?: string;
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
  // Toggle del panel de UI/UX (ajustes visuales)
  showUX?: boolean;
  onToggleUX?: () => void;
  uxPanel?: ReactNode;
}

/**
 * DevToolsPanel: agrupa acciones de desarrollo/diagnóstico.
 * Presentacional; delega callbacks al contenedor.
 */
function DevToolsPanel({ onToggleRules, className, showIA = false, onToggleIA = () => {}, iaPanel, showHistory = false, onToggleHistory = () => {}, fullWidth = false, showFases = true, onToggleFases = () => {}, showUX = false, onToggleUX = () => {}, uxPanel }: DevToolsPanelProps) {
  const wrapperClass = [
    'panel',
    'devtools-panel',
    className ?? '',
    fullWidth ? 'is-fullwidth' : '',
  ].join(' ').trim();

  return (
    <div className={wrapperClass}>
      <div className="row actions devtools-actions">
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
        <button className="devtools-btn" onClick={onToggleIA} aria-pressed={!!showIA} title="Alternar panel de IA">
          <svg className="devtools-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3c4.97 0 9 3.58 9 8 0 4.42-4.03 8-9 8-.69 0-1.36-.07-2-.2L7 21l.65-2.28C6.06 17.51 5 15.86 5 14c0-4.42 4.03-8 9-8Z"/></svg>
          <span className="devtools-btn__label">IA {showIA ? '▾' : '▸'}</span>
        </button>
        <button className="devtools-btn" onClick={onToggleUX} aria-pressed={!!showUX} title="Opciones de UI/UX (tamaño, sombra y animaciones)">
          <svg className="devtools-btn__icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm7.43-3.04c.04-.31.07-.62.07-.96s-.03-.65-.07-.96l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.42 7.42 0 0 0-1.66-.96l-.38-2.65A.5.5 0 0 0 11.96 0H8.04a.5.5 0 0 0-.5.42L7.16 3.07c-.59.23-1.14.53-1.66.88l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64L2.75 8.9c-.05.32-.08.64-.08.97s.03.65.08.97L.53 12.5a.5.5 0 0 0-.12.64l2 3.46c.13.22.39.31.6.22l2.49-1c.52.35 1.07.65 1.66.88l.38 2.65c.04.24.25.42.5.42h3.92c.25 0 .46-.18.5-.42l.38-2.65c.59-.23 1.14-.53 1.66-.88l2.49 1c.21.09.47 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65Z"/></svg>
          <span className="devtools-btn__label">UI/UX {showUX ? '▾' : '▸'}</span>
        </button>
      </div>
      {showIA && iaPanel && (
        <div className="row devtools-section">
          {iaPanel}
        </div>
      )}
      {showUX && uxPanel && (
        <div className="row devtools-section">
          {uxPanel}
        </div>
      )}
    </div>
  );
}

export default DevToolsPanel;

