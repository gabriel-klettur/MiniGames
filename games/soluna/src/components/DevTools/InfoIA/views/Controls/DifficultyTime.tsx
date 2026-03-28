import React from 'react';

const DifficultyTime: React.FC<{ depth: number; onDepthChange: (d: number) => void; timeMode: 'auto' | 'manual'; onTimeModeChange: (m: 'auto' | 'manual') => void; timeSeconds: number; onTimeSecondsChange: (s: number) => void }>
= ({ depth, onDepthChange, timeMode, onTimeModeChange, timeSeconds, onTimeSecondsChange }) => (
  <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
    <label className="label">Dificultad</label>
    <select value={depth} onChange={(e) => onDepthChange(Number(e.target.value))}>
      {[10,11,12,13,14,15,16,17,18,19].map(d => <option key={d} value={d}>{d}</option>)}
    </select>
    <label className="label">Tiempo</label>
    <div className="segmented" role="group">
      <button className={timeMode === 'auto' ? 'active' : ''} onClick={() => onTimeModeChange('auto')}>Auto</button>
      <button className={timeMode === 'manual' ? 'active' : ''} onClick={() => onTimeModeChange('manual')}>Manual</button>
    </div>
    {timeMode === 'manual' && (
      <>
        <label className="label">s</label>
        <input type="number" min={0} max={30} step={0.5} value={timeSeconds} onChange={(e) => onTimeSecondsChange(Number(e.target.value))} style={{ width: 90 }} />
      </>
    )}
  </div>
);

export default DifficultyTime;

