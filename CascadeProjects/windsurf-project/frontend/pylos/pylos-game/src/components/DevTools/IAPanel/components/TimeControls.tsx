import type { TimeMode } from '../types';

export interface TimeControlsProps {
  timeMode: TimeMode;
  timeSeconds: number;
  onChangeTimeMode: (m: TimeMode) => void;
  onChangeTimeSeconds: (secs: number) => void;
}

export default function TimeControls({ timeMode, timeSeconds, onChangeTimeMode, onChangeTimeSeconds }: TimeControlsProps) {
  return (
    <>
      <label className="label">Tiempo</label>
      <div className="segmented" role="group" aria-label="Modo de tiempo IA">
        <button className={timeMode === 'auto' ? 'active' : ''} onClick={() => onChangeTimeMode('auto')} aria-pressed={timeMode === 'auto'}>Auto</button>
        <button className={timeMode === 'manual' ? 'active' : ''} onClick={() => onChangeTimeMode('manual')} aria-pressed={timeMode === 'manual'}>Manual</button>
      </div>
      {timeMode === 'manual' && (
        <div className="ia-panel__range" aria-label="Selector de tiempo manual">
          <input
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={timeSeconds}
            onChange={(e) => onChangeTimeSeconds(Number(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={30}
            aria-valuenow={timeSeconds}
          />
          <span className="range-value">{timeSeconds.toFixed(1)} s</span>
        </div>
      )}
    </>
  );
}

