import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resetGame, toggleOrientation } from '../store/gameSlice';
import type { RootState } from '../store';
import ToggleSwitch from './ui/ToggleSwitch';

export default function HeaderPanel() {
  const dispatch = useAppDispatch();
  const winner = useAppSelector((s: RootState) => s.game.winner);
  const orientation = useAppSelector((s: RootState) => s.game.ui.orientation);

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
          onClick={() => dispatch(resetGame())}
          className="px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 active:bg-blue-600 border border-blue-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 shadow-sm"
        >
          Reiniciar
        </button>
      </div>
    </header>
  );
}

