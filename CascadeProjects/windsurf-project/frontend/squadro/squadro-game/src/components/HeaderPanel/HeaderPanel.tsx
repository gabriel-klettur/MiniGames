import { useRef, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetGame, setOrientation, setAIEnabled, setAISide, setAIDifficulty, setAITimeMode, setAITimeSeconds } from '../../store/gameSlice';
import type { RootState } from '../../store';
import '../../styles/header.css';
import type { Player } from '../../game/types';
import VsAiPopover from './VsAiPopover/VsAiPopover';

interface HeaderProps {
  showIA?: boolean;
  onToggleIA?: () => void;
}

export default function HeaderPanel({ showIA = false, onToggleIA }: HeaderProps) {
  const dispatch = useAppDispatch();
  const winner = useAppSelector((s: RootState) => s.game.winner);
  const orientation = useAppSelector((s: RootState) => s.game.ui.orientation);
  // Vs IA popover state
  const [vsOpen, setVsOpen] = useState(false);
  const [selectedSide, setSelectedSide] = useState<Player | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const toggleVsOpen = () => {
    if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect());
    setVsOpen((v) => !v);
  };

  // Close popover on click outside
  useEffect(() => {
    if (!vsOpen) return;
    const onDocClick = (ev: MouseEvent) => {
      const t = ev.target as Node | null;
      if (!t) return;
      const inBtn = btnRef.current?.contains(t) ?? false;
      const inPop = popRef.current?.contains(t) ?? false;
      if (!inBtn && !inPop) setVsOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [vsOpen]);

  return (
    <section className="header-bar" aria-label="Encabezado">
      <div className="row header">
        <h2>Squadro v0.71.29.9.2025</h2>
        <div className="header-actions">
          <button onClick={() => dispatch(resetGame())} aria-label="Nueva partida" title="Nueva partida">
            <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6z"/></svg>
            <span className="sr-only">Nueva partida</span>
          </button>

        {/* Botón IA (mismo estilo Soluna) */}
        <button
          onClick={onToggleIA}
          aria-pressed={!!showIA}
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

          {/* Botón Vs IA */}
        <button
          ref={btnRef}
          onClick={toggleVsOpen}
          aria-expanded={vsOpen}
          aria-pressed={vsOpen}
          aria-controls="vsai-popover"
          aria-label="Configurar partida Vs IA"
        >
          <svg className="header-btn__icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M13.5 12.5 21 20l-1 1-7.5-7.5L6 20l-1-1 6.5-6.5L4 5 5 4l7.5 6.5L19 4l1 1-6.5 7.5Z"/>
          </svg>
          <span className="header-btn__label">Vs IA</span>
        </button>

        {/* Alternar orientación con un solo botón tipo toggle (Pylos chip style) */}
        <button
          onClick={() => dispatch(setOrientation(orientation === 'classic' ? 'bga' : 'classic'))}
          aria-pressed={orientation === 'bga'}
          aria-label={orientation === 'classic' ? 'Orientación actual: Clásico (clic para cambiar a BGA)' : 'Orientación actual: BGA (clic para cambiar a Clásico)'}
          title={orientation === 'classic' ? 'Cambiar a BGA' : 'Cambiar a Clásico'}
        >
          <span className="header-btn__label">{orientation === 'classic' ? 'Clásico' : 'BGA'}</span>
        </button>

        {/* Ganador como chip informativo (fuera del alcance de botones iguales) */}
        {winner && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
            Ganador: <span className="font-semibold">{winner}</span>
          </span>
        )}
        </div>
      </div>
    {/* Popover Vs IA */}
    {vsOpen && (
      <VsAiPopover
        anchorRect={anchorRect}
        popRef={popRef}
        selectedSide={selectedSide}
        onSelectSide={(side: Player) => setSelectedSide(side)}
        onPickDifficulty={(difficulty: number) => {
          if (!selectedSide) return;
          // Enable VS IA and configure side + difficulty
          dispatch(setAIEnabled(true));
          dispatch(setAISide(selectedSide));
          dispatch(setAIDifficulty(difficulty));
          // VS IA: siempre sin límite de tiempo (manual 0s)
          dispatch(setAITimeMode('manual'));
          dispatch(setAITimeSeconds(0));
          setVsOpen(false);
        }}
      />
    )}
  </section>
  );
}
