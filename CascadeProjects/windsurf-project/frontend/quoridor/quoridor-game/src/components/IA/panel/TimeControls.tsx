import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks.ts';
import type { RootState } from '../../../store/index.ts';
import { setTimeMode, setTimeSeconds, setSafetyMarginSeconds } from '../../../store/iaSlice.ts';

interface Props {
  elapsedMs: number;
  /** When false, hides time mode and sliders; shows only elapsed and progress bar. */
  showControls?: boolean;
  /**
   * Selects the cap for progress when in manual mode.
   * - 'effective': uses (timeSeconds - safetyMargin)
   * - 'full': uses full timeSeconds (ignores safety margin)
   */
  capMode?: 'effective' | 'full';
}

export default function TimeControls({ elapsedMs, showControls = true, capMode = 'effective' }: Props) {
  const dispatch = useAppDispatch();
  const ia = useAppSelector((s: RootState) => s.ia);
  const safetyMargin = ia.config.safetyMarginSeconds ?? 0.15;
  const baseCapMs = ia.timeMode === 'manual' ? ia.timeSeconds * 1000 : null;
  const timeCapMs = ia.timeMode === 'manual'
    ? Math.max(0, (capMode === 'full' ? (baseCapMs ?? 0) : (baseCapMs ?? 0) - safetyMargin * 1000))
    : null;

  // Animate elapsed with rAF while busy for smooth updates
  const [animatedElapsed, setAnimatedElapsed] = React.useState(elapsedMs);
  const rafRef = React.useRef<number | null>(null);
  const startTsRef = React.useRef<number | null>(null); // timestamp when busy started
  const startOffsetRef = React.useRef<number>(0); // starting elapsed (usually 0)

  React.useEffect(() => {
    if (ia.stats.busy) {
      // Initialize baseline only once per busy session
      if (startTsRef.current == null) {
        startTsRef.current = performance.now();
        startOffsetRef.current = Math.max(0, elapsedMs || 0);
      }
      const tick = () => {
        const now = performance.now();
        const dt = now - (startTsRef.current ?? now);
        setAnimatedElapsed(startOffsetRef.current + dt);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
    } else {
      // Reset tracking when not busy
      startTsRef.current = null;
      startOffsetRef.current = 0;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setAnimatedElapsed(elapsedMs);
    }
  }, [ia.stats.busy]);

  // When not busy, keep local state in sync with store value
  React.useEffect(() => {
    if (!ia.stats.busy) setAnimatedElapsed(elapsedMs);
  }, [elapsedMs, ia.stats.busy]);

  const shownElapsed = ia.stats.busy ? animatedElapsed : elapsedMs;
  const timeProgress = timeCapMs ? Math.min(1, (shownElapsed || 0) / Math.max(1, timeCapMs)) : 0;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm">Tiempo respuesta</span>
        {showControls && (
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
        )}
        {showControls && ia.timeMode === 'manual' && (
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
        {showControls && ia.timeMode === 'manual' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Margen</span>
            <input
              type="range"
              min={0}
              max={5}
              step={0.05}
              value={safetyMargin}
              onChange={(e) => dispatch(setSafetyMarginSeconds(Number(e.target.value)))}
            />
            <span className="text-xs text-gray-300 w-14 text-right">{safetyMargin.toFixed(2)} s</span>
          </div>
        )}
        <div className="ml-auto text-xs text-gray-300">{(shownElapsed / 1000).toFixed(1)} s</div>
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
