import { useEffect, useRef, useState } from 'react';
import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';

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
  // Iniciar partida contra IA (selección de lado y dificultad)
  onStartVsAI?: (enemy: 'L' | 'D', depth: number) => void;
  // Historial: estado de visibilidad y alternador
  showHistory?: boolean;
  onToggleHistory?: () => void;
  // Control para ocultar el botón Historial en el header
  showHistoryToggle?: boolean;
}

/**
 * HeaderPanel: muestra el nombre del juego y acciones principales (Nuevo, Dev).
 * Se piensa para el Sidebar y busca ser compacto en altura.
 */
function HeaderPanel({ title = 'Pylos v1.29.9.610-PR', onNewGame, showTools, onToggleDev, showIA = false, onToggleIA = () => {}, showIAToggle = true, showDevToggle = true, onStartVsAI = () => {}, showHistory = false, onToggleHistory = () => {}, showHistoryToggle = true }: HeaderPanelProps) {
  // Estado del popover para Partida Vs IA
  const [vsOpen, setVsOpen] = useState<boolean>(false);
  const [selectedSide, setSelectedSide] = useState<'L' | 'D' | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const [popTop, setPopTop] = useState<number | null>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!vsOpen) return;
      const target = e.target as Node | null;
      if (popRef.current && popRef.current.contains(target)) return;
      if (btnRef.current && btnRef.current.contains(target)) return;
      setVsOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [vsOpen]);

  const toggleVsOpen = () => {
    if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect());
    setVsOpen((v) => !v);
  };

  // Inicio inmediato tras elegir dificultad
  const onPickDifficulty = (depth: number) => {
    if (!selectedSide) return;
    onStartVsAI(selectedSide, depth);
    setVsOpen(false);
    setSelectedSide(null);
  };

  // Posicionamiento: pegado a la derecha y debajo del botón, sin salir de viewport
  useEffect(() => {
    if (!vsOpen) return;
    const margin = 8;
    const updatePosition = () => {
      const rect = btnRef.current?.getBoundingClientRect() ?? anchorRect;
      if (rect) setAnchorRect(rect);
      const popEl = popRef.current;
      const popH = popEl ? popEl.offsetHeight : 0;
      let desiredTop = (rect ? rect.bottom : 0) + margin;
      // clamp to viewport
      const maxTop = Math.max(margin, window.innerHeight - popH - margin);
      const clampedTop = Math.min(Math.max(margin, desiredTop), maxTop);
      setPopTop(clampedTop);
    };
    // Measure after paint
    const id = window.requestAnimationFrame(updatePosition);
    const onWin = () => updatePosition();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, { passive: true });
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin);
    };
  }, [vsOpen, anchorRect]);
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
          {/* Botón Partida Vs IA */}
          <button
            ref={btnRef}
            onClick={toggleVsOpen}
            aria-expanded={vsOpen}
            aria-controls="vsai-popover"
            aria-label="Partida versus IA"
            title="Partida Vs IA"
          >
            {/* Swords icon */}
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M13.5 12.5 21 20l-1 1-7.5-7.5L6 20l-1-1 6.5-6.5L4 5 5 4l7.5 6.5L19 4l1 1-6.5 7.5Z"/>
            </svg>
            <span className="header-btn__label">Vs IA</span>
          </button>
          {showIAToggle && (
            <button
              onClick={onToggleIA}
              aria-pressed={showIA}
              aria-label="Alternar panel de IA"
              title="IA"
            >
              <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M11 2h2v3h-2z"/>
                <rect x="5" y="7" width="14" height="10" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="9" cy="12" r="1.6" fill="currentColor"/>
                <circle cx="15" cy="12" r="1.6" fill="currentColor"/>
                <path fill="currentColor" d="M7 19h3v2H7zM14 19h3v2h-3z"/>
                <path fill="currentColor" d="M2 11h2v2H2zM20 11h2v2h-2z"/>
              </svg>
              <span className="header-btn__label">IA</span>
            </button>
          )}
          {showHistoryToggle && (
            <button
              onClick={onToggleHistory}
              aria-pressed={showHistory}
              aria-label="Alternar historial"
              title="Historial"
            >
              <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/>
              </svg>
              <span className="header-btn__label"></span>
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
      {/* Popover Vs IA */}
      {vsOpen && (
        <div
          id="vsai-popover"
          ref={popRef}
          className="popover vsai-popover"
          role="dialog"
          aria-label="Configurar partida vs IA"
          style={{
            position: 'fixed',
            top: popTop ?? (anchorRect ? anchorRect.bottom + 8 : 8),
            right: 8,
          }}
        >
          <div className="vsai-section" aria-label="Seleccionar lado">
            <div className="vsai-title">VS</div>
            <div className="vsai-options" role="listbox" aria-label="Lado enemigo">
              <button
                className={selectedSide === 'L' ? 'active' : ''}
                onClick={() => setSelectedSide('L')}
                aria-selected={selectedSide === 'L'}
              >
                <img src={bolaB} alt="Ficha naranja (izquierda)" />
                <span>Naranja</span>
              </button>
              <button
                className={selectedSide === 'D' ? 'active' : ''}
                onClick={() => setSelectedSide('D')}
                aria-selected={selectedSide === 'D'}
              >
                <img src={bolaA} alt="Ficha marrón (derecha)" />
                <span>Marrón</span>
              </button>
            </div>
        </div>
        {/* Velocidad/tiempo removidos: configuración centralizada en IAPanel (DevTools) */}
        <div className="vsai-section" aria-label="Seleccionar dificultad">
          <div className="vsai-title">Dificultad</div>
          <div className="vsai-diffs" role="listbox" aria-label="Nivel de dificultad">
            {[1,2,3,4,5,6,7,8,9,10].map((d) => (
              <button
                key={d}
                onClick={() => onPickDifficulty(d)}
                disabled={!selectedSide}
                title={selectedSide ? `Comenzar vs IA (nivel ${d})` : 'Elige un lado primero'}
              >{d}</button>
            ))}
          </div>
          <div className="vsai-hint">El juego comienza tras elegir dificultad.</div>
        </div>
      </div>
      )}
    </section>
  );
}

export default HeaderPanel;
