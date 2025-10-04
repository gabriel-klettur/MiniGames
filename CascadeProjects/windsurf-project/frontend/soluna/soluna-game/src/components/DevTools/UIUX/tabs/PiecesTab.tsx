import React from 'react';
import type { Cfg } from '../model/config';
import { CheckboxRow, SliderRow } from '../components/Rows';

export function PiecesTab({ cfg, onNum }: { cfg: Cfg; onNum: (k: keyof Cfg) => (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <SliderRow
        label={`Separación entre discos: ${Math.round(cfg.stackStep)}px`}
        value={cfg.stackStep}
        min={6}
        max={30}
        step={1}
        onChange={onNum('stackStep')}
      />
      <CheckboxRow label="Resaltar destino con borde amarillo al arrastrar" checked={cfg.dropHighlight} onChange={onNum('dropHighlight')} />
      <CheckboxRow label="Permitir mover libremente si no hay fusión" checked={cfg.freeMove} onChange={onNum('freeMove')} />
      <SliderRow
        label={`Umbral de colisión para apilar: ${cfg.mergeThreshold.toFixed(2)}× diámetro`}
        value={cfg.mergeThreshold}
        min={0.3}
        max={0.9}
        step={0.01}
        onChange={onNum('mergeThreshold')}
      />
    </div>
  );
}
