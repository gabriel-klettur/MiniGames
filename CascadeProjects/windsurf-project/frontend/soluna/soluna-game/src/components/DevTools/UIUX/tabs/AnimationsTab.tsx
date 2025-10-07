import React from 'react';
import type { Cfg } from '../model/config';
import { SliderRow, Section, CheckboxRow } from '../components/Rows';

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
        label={`Desplazamiento Y destino: ${Math.round(cfg.flightDestOffsetY)}px`}
        value={cfg.flightDestOffsetY}
        min={-60}
        max={60}
        step={1}
        onChange={onNum('flightDestOffsetY')}
      />
      <SliderRow
        label={`Retardo overlay tras aterrizar: ${Math.round(cfg.flightLingerMs)}ms`}
        value={cfg.flightLingerMs}
        min={0}
        max={1000}
        step={10}
        onChange={onNum('flightLingerMs')}
      />
      <Section title="Teleportación Fichas">
        <CheckboxRow
          label="Nueva partida Aleatorio"
          checked={!!cfg.teleportRandom}
          onChange={onNum('teleportRandom')}
        />
        <CheckboxRow
          label="Confirmar tablero (No Aleatorio)"
          checked={!!cfg.teleportManualConfirm}
          onChange={onNum('teleportManualConfirm')}
        />
        <CheckboxRow
          label="Colocar ficha en celda (No Aleatorio)"
          checked={!!cfg.teleportManualPick}
          onChange={onNum('teleportManualPick')}
        />
      </Section>
    </div>
  );
}
