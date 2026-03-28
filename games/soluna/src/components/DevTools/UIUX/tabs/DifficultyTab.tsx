import React from 'react';
import type { Cfg } from '../model/config';
import { CheckboxRow, SliderRow } from '../components/Rows';

export function DifficultyTab({ cfg, onNum }: { cfg: Cfg; onNum: (k: keyof Cfg) => (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <CheckboxRow
        label={"Mostrar dificultad en popovers"}
        checked={cfg.showDifficultyInPopovers}
        onChange={onNum('showDifficultyInPopovers')}
        tooltip="Si se desactiva, los popovers no mostrarán controles de dificultad y se usará la dificultad por defecto."
      />
      <SliderRow
        label={`Dificultad por defecto: ${Math.round(cfg.defaultDifficulty)}`}
        value={cfg.defaultDifficulty}
        min={1}
        max={30}
        step={1}
        onChange={onNum('defaultDifficulty')}
        tooltip="Nivel por defecto que usará la IA cuando los controles de dificultad estén ocultos."
      />
    </div>
  );
}
