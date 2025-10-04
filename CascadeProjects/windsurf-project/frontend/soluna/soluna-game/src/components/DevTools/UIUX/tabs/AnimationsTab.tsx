import React from 'react';
import type { Cfg } from '../model/config';
import { SliderRow } from '../components/Rows';

export function AnimationsTab({ cfg, onNum }: { cfg: Cfg; onNum: (k: keyof Cfg) => (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <SliderRow
        label={`Curvatura: ${cfg.flightCurveBend.toFixed(2)}× distancia`}
        value={cfg.flightCurveBend}
        min={0.05}
        max={0.4}
        step={0.01}
        onChange={onNum('flightCurveBend')}
      />
      <SliderRow
        label={`Desplazamiento X destino: ${Math.round(cfg.flightDestOffsetX)}px`}
        value={cfg.flightDestOffsetX}
        min={-60}
        max={60}
        step={1}
        onChange={onNum('flightDestOffsetX')}
      />
      <SliderRow
        label={`Desplazamiento Y destino: ${Math.round(cfg.flightDestOffsetY)}px`}
        value={cfg.flightDestOffsetY}
        min={-60}
        max={60}
        step={1}
        onChange={onNum('flightDestOffsetY')}
      />
    </div>
  );
}
