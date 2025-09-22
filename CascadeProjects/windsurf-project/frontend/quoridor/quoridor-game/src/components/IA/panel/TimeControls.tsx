import { useAppDispatch, useAppSelector } from '../../../store/hooks.ts';
import type { RootState } from '../../../store/index.ts';
import { setTimeMode, setTimeSeconds } from '../../../store/iaSlice.ts';

interface Props {
  elapsedMs: number;
}

export default function TimeControls({ elapsedMs }: Props) {
  const dispatch = useAppDispatch();
  const ia = useAppSelector((s: RootState) => s.ia);
  const timeCapMs = ia.timeMode === 'manual' ? ia.timeSeconds * 1000 : null;
  const timeProgress = timeCapMs ? Math.min(1, (elapsedMs || 0) / Math.max(1, timeCapMs)) : 0;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm">Tiempo</span>
        <div className="inline-flex rounded-md overflow-hidden border border-white/10">
          <button
            className={["px-3 py-1.5 text-sm", ia.timeMode === 'auto' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-100 hover:bg-gray-700'].join(' ')}
            onClick={() => dispatch(setTimeMode('auto'))}
            aria-pressed={ia.timeMode === 'auto'}
          >Auto</button>
          <button
            className={["px-3 py-1.5 text-sm", ia.timeMode === 'manual' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-100 hover:bg-gray-700'].join(' ')}
            onClick={() => dispatch(setTimeMode('manual'))}
            aria-pressed={ia.timeMode === 'manual'}
          >Manual</button>
        </div>
        {ia.timeMode === 'manual' && (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={60}
              step={0.5}
              value={ia.timeSeconds}
              onChange={(e) => dispatch(setTimeSeconds(Number(e.target.value)))}
            />
            <span className="text-xs text-gray-300 w-14 text-right">{Number(ia.timeSeconds).toFixed(1)} s</span>
          </div>
        )}
        <div className="ml-auto text-xs text-gray-300">{(elapsedMs / 1000).toFixed(1)} s</div>
      </div>
      {ia.timeMode === 'manual' && (
        <div className="w-full h-1.5 bg-gray-800/70 rounded overflow-hidden">
          <div
            className={['h-full transition-all', timeProgress < 1 ? 'bg-emerald-600' : 'bg-rose-500'].join(' ')}
            style={{ width: `${(timeProgress * 100).toFixed(1)}%` }}
          />
        </div>
      )}
    </div>
  );
}
