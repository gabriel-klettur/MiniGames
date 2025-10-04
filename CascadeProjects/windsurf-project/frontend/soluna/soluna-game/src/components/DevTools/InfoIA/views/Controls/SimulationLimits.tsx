import React from 'react';

const SimulationLimits: React.FC<{ pliesLimit: number; onPliesLimitChange: (v: number) => void; setsCount: number; onSetsCountChange: (v: number) => void }>
= ({ pliesLimit, onPliesLimitChange, setsCount, onSetsCountChange }) => (
  <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
    <label className="label" htmlFor="limit-plies">Límite jugadas</label>
    <input id="limit-plies" type="number" min={1} max={1000} step={1} value={pliesLimit} onChange={(e) => onPliesLimitChange(Math.max(1, Math.min(1000, Number(e.target.value))))} style={{ width: 90 }} />
    <label className="label" htmlFor="limit-sets">Sets</label>
    <input id="limit-sets" type="number" min={1} max={1000} step={1} value={setsCount} onChange={(e) => onSetsCountChange(Math.max(1, Math.min(1000, Number(e.target.value))))} style={{ width: 90 }} />
  </div>
);

export default SimulationLimits;
