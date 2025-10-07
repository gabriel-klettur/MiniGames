import React from 'react';
import type { Cfg } from '../model/config';
import { SliderRow } from '../components/Rows';

export function AnimationsTab({ cfg, onNum }: { cfg: Cfg; onNum: (k: keyof Cfg) => (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {/* Curvatura slider removido */}
      <SliderRow
        label={`Desplazamiento Y destino: ${Math.round(cfg.flightDestOffsetY)}px`}
        value={cfg.flightDestOffsetY}
        min={-60}
        max={60}
        step={1}
        onChange={onNum('flightDestOffsetY')}
        tooltip="Desplaza verticalmente el destino del vuelo en píxeles. Ajusta el aterrizaje visual."
      />
      <SliderRow
        label={`Retardo overlay tras aterrizar: ${Math.round(cfg.flightLingerMs)}ms`}
        value={cfg.flightLingerMs}
        min={0}
        max={1000}
        step={10}
        onChange={onNum('flightLingerMs')}
        tooltip="Tiempo en milisegundos que el overlay permanece visible después de aterrizar."
      />
      {/* Sección 'Teleportación Fichas' y sus opciones removidas */}
    </div>
  );
}
