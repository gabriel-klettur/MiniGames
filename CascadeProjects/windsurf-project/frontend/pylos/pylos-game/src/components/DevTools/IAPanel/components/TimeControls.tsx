import type { TimeMode } from '../types';
import { useI18n } from '../../../../i18n';

export interface TimeControlsProps {
  timeMode: TimeMode;
  timeSeconds: number;
  onChangeTimeMode: (m: TimeMode) => void;
  onChangeTimeSeconds: (secs: number) => void;
}

export default function TimeControls({ timeMode, timeSeconds, onChangeTimeMode, onChangeTimeSeconds }: TimeControlsProps) {
  const { t } = useI18n();
  return (
    <>
      <label className="label">{t.iaPanel.time}</label>
      <div className="segmented" role="group" aria-label={t.iaPanel.timeMode}>
        <button className={timeMode === 'auto' ? 'active' : ''} onClick={() => onChangeTimeMode('auto')} aria-pressed={timeMode === 'auto'}>{t.iaPanel.auto}</button>
        <button className={timeMode === 'manual' ? 'active' : ''} onClick={() => onChangeTimeMode('manual')} aria-pressed={timeMode === 'manual'}>{t.iaPanel.manual}</button>
      </div>
      {timeMode === 'manual' && (
        <div className="ia-panel__range" aria-label={t.iaPanel.manualTimeSelector}>
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

