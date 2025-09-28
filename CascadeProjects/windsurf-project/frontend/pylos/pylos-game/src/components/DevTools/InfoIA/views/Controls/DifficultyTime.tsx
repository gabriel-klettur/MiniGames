export function DifficultyTime(props: {
  depth: number;
  onDepthChange: (d: number) => void;
  timeMode: 'auto' | 'manual';
  onTimeModeChange: (m: 'auto' | 'manual') => void;
  timeSeconds: number;
  onTimeSecondsChange: (v: number) => void;
}) {
  const { depth, onDepthChange, timeMode, onTimeModeChange, timeSeconds, onTimeSecondsChange } = props;
  return (
    <>
      <label className="label" htmlFor="infoia-depth">Dificultad</label>
      <select id="infoia-depth" value={depth} onChange={(e) => onDepthChange(Number(e.target.value))}>
        {[1,2,3,4,5,6,7,8,9,10].map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <label className="label">Tiempo</label>
      <div className="segmented" role="group" aria-label="Modo de tiempo de simulación">
        <button className={timeMode === 'auto' ? 'active' : ''} onClick={() => onTimeModeChange('auto')} aria-pressed={timeMode === 'auto'}>Auto</button>
        <button className={timeMode === 'manual' ? 'active' : ''} onClick={() => onTimeModeChange('manual')} aria-pressed={timeMode === 'manual'}>Manual</button>
      </div>
      {timeMode === 'manual' && (
        <div className="ia-panel__range" aria-label="Selector de tiempo manual">
          <input
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={timeSeconds}
            onChange={(e) => onTimeSecondsChange(Number(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={30}
            aria-valuenow={timeSeconds}
          />
          <span className="range-value badge">{timeSeconds.toFixed(1)} s</span>
        </div>
      )}
    </>
  );
}
