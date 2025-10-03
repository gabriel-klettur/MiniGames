import { useRef, useState } from 'react';
import { useGame } from '../../game/store';
import useClickOutside from '../../hooks/useClickOutside';
import useBackgroundCatalog from '../../hooks/useBackgroundCatalog';
import useBackgroundControls from '../../hooks/useBackgroundControls';
import VsAiPopover from './VsAiPopover';
import BackgroundPopover from './BackgroundPopover';

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

  // Estado y acciones del fondo (DOM + CSS variables/atributos)
  const {
    bgHidden,
    woodHidden,
    fullBg,
    selectedBgUrl,
    applyBoardImage,
    toggleHideBoardBg,
    toggleHideWoodBoard,
    toggleFullBg,
  } = useBackgroundControls();

  // Catálogo de fondos
  const bgCatalog = useBackgroundCatalog();

  // Cierre por click fuera SOLO para VS IA (el de Fondo permanece abierto hasta pulsar el botón)
  useClickOutside([btnRef, popRef], vsOpen, () => setVsOpen(false));
  // Cierre por click fuera para el popover de Fondo
  useClickOutside([bgBtnRef, bgPopRef], bgOpen, () => setBgOpen(false));

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
        <BackgroundPopover
          anchorRect={bgAnchorRect}
          popRef={bgPopRef}
          bgHidden={bgHidden}
          woodHidden={woodHidden}
          fullBg={fullBg}
          selectedBgUrl={selectedBgUrl}
          onToggleHideBoardBg={toggleHideBoardBg}
          onToggleFullBg={toggleFullBg}
          onToggleHideWoodBoard={toggleHideWoodBoard}
          onApplyBoardImage={applyBoardImage}
          bgCatalog={bgCatalog}
        />
      )}

      {/* Popover Vs IA */}
      {vsOpen && (
        <VsAiPopover
          anchorRect={anchorRect}
          popRef={popRef}
          selectedSide={selectedSide}
          onSelectSide={(side) => setSelectedSide(side)}
          onPickDifficulty={onPickDifficulty}
        />
      )}
    </section>
  );
}


