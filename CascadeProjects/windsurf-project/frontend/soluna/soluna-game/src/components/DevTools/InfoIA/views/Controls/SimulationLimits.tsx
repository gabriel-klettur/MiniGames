import React from 'react';

const SimulationLimits: React.FC<{ setsCount: number; onSetsCountChange: (v: number) => void }>
= ({ setsCount, onSetsCountChange }) => (
  <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
    <label className="label" htmlFor="limit-sets">Sets</label>
    <input id="limit-sets" type="number" min={1} max={1000} step={1} value={setsCount} onChange={(e) => onSetsCountChange(Math.max(1, Math.min(1000, Number(e.target.value))))} style={{ width: 90 }} />
  </div>
);

export default SimulationLimits;
