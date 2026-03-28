import React from 'react';
import type { Cfg } from '../model/config';
import { SliderRow, CheckboxRow } from '../components/Rows';

export function PiecesTab({ cfg, onNum }: { cfg: Cfg; onNum: (k: keyof Cfg) => (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <CheckboxRow
        label={cfg.stackIndicatorVisible ? 'Indicador de altura: visible' : 'Indicador de altura: oculto'}
        checked={cfg.stackIndicatorVisible}
        onChange={onNum('stackIndicatorVisible')}
        tooltip="Muestra/Oculta el número de altura de la pila en cada ficha."
      />
      <SliderRow
        label={`Separación entre discos: ${Math.round(cfg.stackStep)}px`}
        value={cfg.stackStep}
        min={6}
        max={30}
        step={1}
        onChange={onNum('stackStep')}
        tooltip="Distancia vertical entre fichas apiladas en píxeles. Afecta la legibilidad de la pila."
      />
      {/* Resaltar destino con borde amarillo al arrastrar - removido */}
      {/* Permitir mover libremente si no hay fusión - removido */}
      <SliderRow
        label={`Umbral de colisión para apilar: ${cfg.mergeThreshold.toFixed(2)}× diámetro`}
        value={cfg.mergeThreshold}
        min={0.3}
        max={0.9}
        step={0.01}
        onChange={onNum('mergeThreshold')}
        tooltip="Factor del diámetro que define cuándo dos fichas se consideran colisionadas para apilar."
      />
    </div>
  );
}
