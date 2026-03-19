import { useI18n } from '../../../../../i18n';

export function DifficultyTime(props: {
  depth: number;
  onDepthChange: (d: number) => void;
  timeMode: 'auto' | 'manual';
  onTimeModeChange: (m: 'auto' | 'manual') => void;
  timeSeconds: number;
  onTimeSecondsChange: (v: number) => void;
}) {
  const { t } = useI18n();
  const { depth, onDepthChange, timeMode, onTimeModeChange, timeSeconds, onTimeSecondsChange } = props;
  return (
    <>
      <label
        className="label"
        htmlFor="infoia-depth"
        title={t.infoIA.difficultyTitle}
      >
        {t.infoIA.difficulty}
      </label>
      <select
        id="infoia-depth"
        value={depth}
        onChange={(e) => onDepthChange(Number(e.target.value))}
        title={t.infoIA.currentDepth.replace('{depth}', String(depth))}
      >
        {[1,2,3,4,5,6,7,8,9,10].map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <label className="label" title={t.infoIA.timeTitle}>{t.infoIA.time}</label>
      <div className="segmented" role="group" aria-label={t.infoIA.timeMode}>
        <button
          className={timeMode === 'auto' ? 'active' : ''}
          onClick={() => onTimeModeChange('auto')}
          aria-pressed={timeMode === 'auto'}
          title={t.infoIA.autoTitle}
        >
          {t.infoIA.auto}
        </button>
        <button
          className={timeMode === 'manual' ? 'active' : ''}
          onClick={() => onTimeModeChange('manual')}
          aria-pressed={timeMode === 'manual'}
          title={t.infoIA.manualTitle}
        >
          {t.infoIA.manual}
        </button>
      </div>
      {timeMode === 'manual' && (
        <div className="ia-panel__range" aria-label={t.infoIA.manualTimeSelector}>
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
            title={t.infoIA.budgetPerMove.replace('{time}', timeSeconds.toFixed(1))}
          />
          <span className="range-value badge">{timeSeconds.toFixed(1)} s</span>
        </div>
      )}
    </>
  );
}
