import { useEffect, useRef, useState } from 'react';
import { useGame } from '../game/store';

export interface HeaderProps {
  showIA?: boolean;
  onToggleIA?: () => void;
  onStartVsAI?: (enemy: 1 | 2, depth: number) => void;
}

export default function HeaderPanel({ showIA = true, onToggleIA, onStartVsAI }: HeaderProps) {
  const { state, dispatch } = useGame();

  // Estado del popover Vs IA (anclado al botón y con cierre por click fuera)
  const [vsOpen, setVsOpen] = useState(false);
  const [selectedSide, setSelectedSide] = useState<1 | 2 | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [popTop, setPopTop] = useState<number | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

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

  // Posicionar popover bajo el botón y dentro del viewport
  useEffect(() => {
    if (!vsOpen) return;
    const margin = 8;
    const updatePosition = () => {
      const rect = btnRef.current?.getBoundingClientRect() ?? anchorRect;
      if (rect) setAnchorRect(rect);
      const popEl = popRef.current;
      const popH = popEl ? popEl.offsetHeight : 0;
      const desiredTop = (rect ? rect.bottom : 0) + margin;
      const maxTop = Math.max(margin, window.innerHeight - popH - margin);
      const clampedTop = Math.min(Math.max(margin, desiredTop), maxTop);
      setPopTop(clampedTop);
    };
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

  const onPickDifficulty = (depth: number) => {
    if (!selectedSide) return;
    if (onStartVsAI) onStartVsAI(selectedSide, depth);
    setVsOpen(false);
    setSelectedSide(null);
  };

  return (
    <header className="header-bar">
      <div className="row header">
        <h2>Soluna</h2>
        <div className="header-actions">
          {/* Nueva partida (icono + chip) */}
          <button onClick={() => dispatch({ type: 'reset-game' })} aria-label="Nueva partida" title="Nueva partida">
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z"/>
            </svg>
            <span className="sr-only"></span>
          </button>
          {/* Botón Partida Vs IA (estilo Pylos) */}
          <button
            ref={btnRef}
            onClick={toggleVsOpen}
            aria-expanded={vsOpen}
            aria-controls="vsai-popover"
            aria-label="Partida versus IA"
            title="Partida Vs IA"
          >
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M13.5 12.5 21 20l-1 1-7.5-7.5L6 20l-1-1 6.5-6.5L4 5 5 4l7.5 6.5L19 4l1 1-6.5 7.5Z"/>
            </svg>
            <span className="header-btn__label">Vs IA</span>
          </button>
          {/* Alternar IAUserPanel (icono IA) */}
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
            <span className="sr-only">IA</span>
          </button>
          {/* Nueva ronda como acción primaria visible solo cuando aplica */}
          {state.roundOver && !state.gameOver && (
            <button className="primary" onClick={() => dispatch({ type: 'new-round' })}>Nueva ronda</button>
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
                className={selectedSide === 1 ? 'active' : ''}
                onClick={() => setSelectedSide(1)}
                aria-selected={selectedSide === 1}
              >
                <span>Jugador 1</span>
              </button>
              <button
                className={selectedSide === 2 ? 'active' : ''}
                onClick={() => setSelectedSide(2)}
                aria-selected={selectedSide === 2}
              >
                <span>Jugador 2</span>
              </button>
            </div>
          </div>
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
    </header>
  );
}


