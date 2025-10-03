import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../game/store';

export interface HeaderProps {
  showIA?: boolean;
  onToggleIA?: () => void;
  onStartVsAI?: (enemy: 1 | 2, depth: number) => void;
}

export default function HeaderPanel({ showIA = true, onToggleIA, onStartVsAI }: HeaderProps) {
  const { state, dispatch } = useGame();

  // Estado del popover Vs IA
  const [vsOpen, setVsOpen] = useState(false);
  const [selectedSide, setSelectedSide] = useState<1 | 2 | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Estado del popover Fondo
  const [bgOpen, setBgOpen] = useState(false);
  const [bgAnchorRect, setBgAnchorRect] = useState<DOMRect | null>(null);
  const bgBtnRef = useRef<HTMLButtonElement | null>(null);
  const bgPopRef = useRef<HTMLDivElement | null>(null);

  // Estado visual del fondo y selección actual
  const [bgHidden, setBgHidden] = useState<boolean>(false);
  const [selectedBgUrl, setSelectedBgUrl] = useState<string | null>(null);
  const [woodHidden, setWoodHidden] = useState<boolean>(false);
  const [fullBg, setFullBg] = useState<boolean>(false);

  // Cargar catálogo de fondos desde assets (Vite glob)
  const bgCatalog = useMemo(() => {
    const modules = import.meta.glob('../assets/backgrounds/*.{png,jpg,jpeg,webp,avif,gif}', { eager: true }) as Record<string, any>;
    const items = Object.entries(modules)
      .map(([path, mod]) => ({ path, url: (mod as any).default as string, name: path.split('/').pop() || path }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, []);

  // Inicializar estado desde DOM al montar
  useEffect(() => {
    const root = document.documentElement;
    setBgHidden(root.hasAttribute('data-hide-board-bg'));
    setWoodHidden(root.hasAttribute('data-hide-wood-board'));
    setFullBg(root.hasAttribute('data-full-board-bg'));
    const cssVar = getComputedStyle(root).getPropertyValue('--board-bg-image').trim();
    if (cssVar && cssVar !== 'none') {
      setSelectedBgUrl(cssVar);
    }
  }, []);

  // Cierre por click fuera para ambos popovers
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (vsOpen && !btnRef.current?.contains(target) && !popRef.current?.contains(target)) {
        setVsOpen(false);
      }
      // Fondo: no cerrar por click fuera; sólo cierra con el botón Fondo
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [vsOpen, bgOpen]);

  const toggleVsOpen = () => {
    if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect());
    setVsOpen((v) => !v);
  };

  const toggleBgOpen = () => {
    if (bgBtnRef.current) setBgAnchorRect(bgBtnRef.current.getBoundingClientRect());
    setBgOpen((v) => !v);
  };

  const onPickDifficulty = (d: number) => {
    if (!selectedSide) return;
    onStartVsAI?.(selectedSide, d);
    setVsOpen(false);
  };

  const applyHideBoardBg = (hide: boolean) => {
    const root = document.documentElement;
    if (hide) {
      root.setAttribute('data-hide-board-bg', '1');
    } else {
      root.removeAttribute('data-hide-board-bg');
    }
    // Mantener popover abierto tras seleccionar opción
    setBgHidden(hide);
  };

  const toggleHideBoardBg = () => {
    applyHideBoardBg(!bgHidden);
  };

  const applyBoardImage = (url: string | null) => {
    const root = document.documentElement;
    if (url) {
      // Guardamos capa completa (url + posicionamiento) en la variable CSS
      root.style.setProperty('--board-bg-image', `url('${url}') center / cover no-repeat`);
      setSelectedBgUrl(url);
    } else {
      root.style.removeProperty('--board-bg-image');
      setSelectedBgUrl(null);
    }
  };

  const applyHideWoodBoard = (hide: boolean) => {
    const root = document.documentElement;
    if (hide) {
      root.setAttribute('data-hide-wood-board', '1');
    } else {
      root.removeAttribute('data-hide-wood-board');
    }
    setWoodHidden(hide);
  };

  const toggleHideWoodBoard = () => {
    applyHideWoodBoard(!woodHidden);
  };

  const applyFullBg = (full: boolean) => {
    const root = document.documentElement;
    if (full) {
      root.setAttribute('data-full-board-bg', '1');
    } else {
      root.removeAttribute('data-full-board-bg');
    }
    setFullBg(full);
  };

  const toggleFullBg = () => {
    applyFullBg(!fullBg);
  };

  return (
    <section className="header-bar" aria-label="Encabezado">
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

          {/* Botón Fondo (mostrar/ocultar fondo tablero) */}
          <button
            ref={bgBtnRef}
            onClick={toggleBgOpen}
            aria-expanded={bgOpen}
            aria-controls="bg-popover"
            aria-label="Mostrar/Ocultar fondo del tablero"
            title="Fondo"
          >
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M3 5h18v2H3zM3 17h18v2H3zM5 8h14v8H5z"/>
            </svg>
            <span className="header-btn__label">Fondo</span>
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
            <span className="header-btn__label">IA</span>
          </button>

          {/* Nueva ronda como acción primaria visible solo cuando aplica */}
          {state.roundOver && !state.gameOver && (
            <button className="primary" onClick={() => dispatch({ type: 'new-round' })}>Nueva ronda</button>
          )}
        </div>
      </div>

      {/* Popover Fondo */}
      {bgOpen && (
        <div
          id="bg-popover"
          ref={bgPopRef}
          className="popover vsai-popover bg-popover"
          role="dialog"
          aria-label="Opciones de fondo del tablero"
          style={{
            position: 'fixed',
            top: bgAnchorRect ? bgAnchorRect.bottom + 8 : 8,
            left: 8,
            right: 8,
          }}
        >
          <div className="vsai-section" aria-label="Visibilidad del tablero">
            <div className="vsai-title">Visibilidad</div>
            <div className="vsai-options" role="group" aria-label="Alternar visibilidad fondo y madera">
              <button
                onClick={toggleHideBoardBg}
                aria-pressed={bgHidden}
                title={bgHidden ? 'Mostrar fondo' : 'Ocultar fondo'}
              >
                {bgHidden ? 'Mostrar fondo' : 'Ocultar fondo'}
              </button>
              <button
                onClick={toggleFullBg}
                aria-pressed={fullBg}
                title={fullBg ? 'Fondo + tablero' : 'Solo fondo'}
              >
                {fullBg ? 'Fondo + tablero' : 'Solo fondo'}
              </button>
              <button
                onClick={toggleHideWoodBoard}
                aria-pressed={woodHidden}
                title={woodHidden ? 'Mostrar tablero de madera' : 'Ocultar tablero de madera'}
              >
                {woodHidden ? 'Mostrar tablero' : 'Ocultar tablero'}
              </button>
            </div>
          </div>

          <div className="vsai-section" aria-label="Seleccionar textura de fondo">
            <div className="vsai-title">Fondos</div>
            <div
              role="listbox"
              aria-label="Catálogo de fondos"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}
            >
              {bgCatalog.map((bg) => {
                const isSelected = selectedBgUrl ? selectedBgUrl.includes(bg.url) : false;
                return (
                  <button
                    key={bg.url}
                    onClick={() => applyBoardImage(bg.url)}
                    aria-selected={isSelected}
                    title={bg.name}
                    style={{
                      width: 56,
                      height: 42,
                      borderRadius: 8,
                      backgroundImage: `url('${bg.url}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: isSelected ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.18)',
                    }}
                  />
                );
              })}
              {/* Opción: Default (sin imagen) */}
              <button
                onClick={() => applyBoardImage(null)}
                aria-selected={selectedBgUrl === null}
                title="Default"
                style={{
                  width: 56,
                  height: 42,
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(17,24,39,0.55)',
                  color: '#e5e7eb',
                  border: selectedBgUrl === null ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.18)',
                  fontSize: 11,
                }}
              >
                Default
              </button>
            </div>
          </div>
        </div>
      )}

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
            top: anchorRect ? anchorRect.bottom + 8 : 8,
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
    </section>
  );
}


