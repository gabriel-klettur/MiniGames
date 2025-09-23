import { useAppDispatch, useAppSelector } from '../../../store/hooks.ts';
import type { RootState } from '../../../store/index.ts';
import { setEngine, setPreset, toggleAutoplay } from '../../../store/iaSlice.ts';

interface Props {
  onMoveIA: () => void;
  canMove: boolean;
  busy: boolean;
}

export default function Toolbar({ onMoveIA, canMove, busy }: Props) {
  const dispatch = useAppDispatch();
  const ia = useAppSelector((s: RootState) => s.ia);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="inline-flex rounded-md overflow-hidden border border-white/10">
        {(['minimax','mcts','hybrid'] as const).map((eng) => (
          <button
            key={eng}
            className={[
              'px-3 py-1.5 text-sm',
              ia.engine === eng ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-100 hover:bg-gray-700',
            ].join(' ')}
            onClick={() => dispatch(setEngine(eng))}
            aria-pressed={ia.engine === eng}
          >
            {eng === 'minimax' ? 'Minimax' : eng === 'mcts' ? 'MCTS' : 'Híbrido'}
          </button>
        ))}
      </div>
      <div className="inline-flex rounded-md overflow-hidden border border-white/10">
        {(['balanced','aggressive','defensive'] as const).map((p) => (
          <button
            key={p}
            className={[
              'px-3 py-1.5 text-sm',
              ia.preset === p ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-100 hover:bg-gray-700',
            ].join(' ')}
            onClick={() => dispatch(setPreset(p))}
            aria-pressed={ia.preset === p}
            title={p === 'balanced' ? 'Equilibrado' : p === 'aggressive' ? 'Agresivo' : 'Defensivo'}
          >
            {p === 'balanced' ? 'Balanceado' : p === 'aggressive' ? 'Agresivo' : 'Defensivo'}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-sm text-white disabled:opacity-60"
          onClick={onMoveIA}
          disabled={!canMove}
          title="Hacer que la IA juegue su turno"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11 2h2v3h-2z"/></svg>
          Mover IA
        </button>
        {busy && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30">
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3"/><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" fill="none"/></svg>
            Pensando…
          </span>
        )}
        <button
          className={["rounded-md px-3 py-1.5 text-sm", ia.autoplay ? 'bg-rose-700 hover:bg-rose-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-100'].join(' ')}
          onClick={() => dispatch(toggleAutoplay())}
          aria-pressed={ia.autoplay}
          disabled={busy && !ia.autoplay}
        >{ia.autoplay ? 'Detener autoplay' : 'Autoplay'}</button>
      </div>
    </div>
  );
}
