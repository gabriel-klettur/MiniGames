import { useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { RootState } from '../../store';
import { resetGame, setAIEnabled, setAIDifficulty, setAISide, setAISpeed } from '../../store/gameSlice';

export interface IAPanelProps {
  open: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
}

// Small colored dot for side buttons
function ColorDot({ color }: { color: string }) {
  return <span className="inline-block w-3 h-3 rounded-full mr-2 shadow" style={{ backgroundColor: color }} />;
}

/**
 * IAPanel (Popover): configuration for Vs IA in Squadro.
 * Options: side (Light/Dark), speed (Auto/Rápido/Normal/Lento), and difficulty 1..10.
 * Starts the game vs AI right after picking difficulty.
 */
export default function IAPanel({ open, anchorRect, onClose }: IAPanelProps) {
  const dispatch = useAppDispatch();
  const ai = useAppSelector((s: RootState) => s.game.ai);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (popRef.current && popRef.current.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, onClose]);

  const top = useMemo(() => {
    const margin = 8;
    const desiredTop = (anchorRect ? anchorRect.bottom : 0) + margin;
    const popH = popRef.current ? popRef.current.offsetHeight : 220;
    const maxTop = Math.max(margin, window.innerHeight - popH - margin);
    return Math.min(Math.max(margin, desiredTop), maxTop);
  }, [anchorRect, open]);

  if (!open) return null;

  const currentSpeed = ai?.speed ?? 'normal';

  return (
    <div
      ref={popRef}
      role="dialog"
      aria-label="Configurar partida vs IA"
      className="fixed right-2 z-50 w-72 rounded-xl border border-neutral-700 bg-neutral-900/95 shadow-2xl backdrop-blur p-3"
      style={{ top }}
    >
      {/* VS */}
      <div className="text-center text-neutral-300 text-sm font-semibold mb-1">VS</div>
      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-800/60 border border-neutral-700 mb-2">
        <button
          onClick={() => dispatch(setAISide('Light'))}
          aria-pressed={ai?.aiSide === 'Light'}
          className={`flex-1 inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm border ${ai?.aiSide === 'Light' ? 'bg-neutral-700 border-white/20 text-neutral-100' : 'bg-neutral-900/50 border-white/10 text-neutral-300 hover:bg-neutral-800'}`}
        >
          <ColorDot color="#f59e0b" /> Claras
        </button>
        <button
          onClick={() => dispatch(setAISide('Dark'))}
          aria-pressed={ai?.aiSide === 'Dark'}
          className={`flex-1 inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm border ${ai?.aiSide === 'Dark' ? 'bg-neutral-700 border-white/20 text-neutral-100' : 'bg-neutral-900/50 border-white/10 text-neutral-300 hover:bg-neutral-800'}`}
        >
          <ColorDot color="#6e2430" /> Oscuras
        </button>
      </div>

      {/* Velocidad */}
      <div className="text-center text-neutral-400 text-xs uppercase tracking-wide">Velocidad</div>
      <div className="grid grid-cols-4 gap-2 mt-2 mb-2">
        {([
          { k: 'auto', label: 'Auto' },
          { k: 'rapido', label: 'Rápido' },
          { k: 'normal', label: 'Normal' },
          { k: 'lento', label: 'Lento' },
        ] as const).map((s) => (
          <button
            key={s.k}
            onClick={() => dispatch(setAISpeed(s.k))}
            aria-pressed={currentSpeed === s.k}
            className={`text-xs rounded-md px-2 py-1 border ${currentSpeed === s.k ? 'bg-blue-700 text-white border-blue-600' : 'bg-neutral-800 text-neutral-200 border-white/10 hover:bg-neutral-700'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Dificultad */}
      <div className="text-center text-neutral-400 text-xs uppercase tracking-wide">Dificultad</div>
      <div className="grid grid-cols-5 gap-2 mt-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            onClick={() => {
              dispatch(setAIDifficulty(d));
              dispatch(setAIEnabled(true));
              dispatch(resetGame());
              onClose();
            }}
            className="rounded-md px-2 py-1 text-sm bg-neutral-800 text-neutral-200 border border-white/10 hover:bg-neutral-700"
            title={`Comenzar vs IA (nivel ${d})`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="text-[11px] text-neutral-500 text-center mt-3">El juego comienza tras elegir dificultad.</div>
    </div>
  );
}
