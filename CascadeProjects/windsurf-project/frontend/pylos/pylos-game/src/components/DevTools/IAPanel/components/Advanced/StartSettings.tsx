import type { AIAdvancedConfig } from '../../types';

export interface StartSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function StartSettings({ iaConfig, onChangeIaConfig }: StartSettingsProps) {
  const random = iaConfig.startRandomFirstMove ?? false;
  const seedVal = iaConfig.startSeed ?? '';
  return (
    <>
      <label>Inicio</label>
      <div>
        <input
          id="ia-start-random"
          type="checkbox"
          checked={random}
          onChange={(e) => onChangeIaConfig({ startRandomFirstMove: e.target.checked })}
        />
        <label htmlFor="ia-start-random" style={{ marginLeft: 6 }}>Movimiento inicial aleatorio</label>
      </div>

      <label>Semilla (opcional)</label>
      <div>
        <input
          id="ia-start-seed"
          type="number"
          value={seedVal as any}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || v === null) {
              onChangeIaConfig({ startSeed: null });
              return;
            }
            const n = Number(v);
            if (Number.isFinite(n)) {
              onChangeIaConfig({ startSeed: Math.floor(n) });
            }
          }}
          placeholder="p.ej. 1234"
          style={{ width: 140 }}
          disabled={!random}
        />
      </div>
    </>
  );
}
