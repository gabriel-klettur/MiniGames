import { useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resetGame, toggleOrientation } from '../store/gameSlice';
import type { RootState } from '../store';
import ToggleSwitch from './ui/ToggleSwitch';
import IAPanel from './IA/IAPanel';

export default function HeaderPanel() {
  const dispatch = useAppDispatch();
  const winner = useAppSelector((s: RootState) => s.game.winner);
  const orientation = useAppSelector((s: RootState) => s.game.ui.orientation);
  const [vsOpen, setVsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const vsBtnRef = useRef<HTMLButtonElement | null>(null);

  return (
    <header className="w-full flex items-center justify-between py-3">
      <h1 className="text-3xl font-extrabold tracking-tight">Squadro</h1>
      <div className="flex items-center gap-3">
        {winner && (
          <span className="px-2.5 py-1 rounded-md bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
            Ganador: <span className="font-semibold">{winner}</span>
          </span>
        )}
        <ToggleSwitch
          checked={orientation === 'classic'}
          onChange={() => dispatch(toggleOrientation())}
          offLabel="BGA"
          onLabel="Clasico"
          className="mr-1"
        />
        <button
          ref={vsBtnRef}
          onClick={() => { if (vsBtnRef.current) setAnchorRect(vsBtnRef.current.getBoundingClientRect()); setVsOpen((v) => !v); }}
          aria-expanded={vsOpen}
          aria-label="Configurar partida Vs IA"
          title="Vs IA"
          className="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 active:bg-gray-700 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 shadow-sm"
        >
          Vs IA
        </button>
        <button
          onClick={() => dispatch(resetGame())}
          className="px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 active:bg-blue-600 border border-blue-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 shadow-sm"
        >
          Reiniciar
        </button>
      </div>
      {/* IA Popover */}
      <IAPanel open={vsOpen} anchorRect={anchorRect} onClose={() => setVsOpen(false)} />
    </header>
  );
}

