import type { AIAdvancedConfig } from '../../types';

export interface StartSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function StartSettings({ iaConfig, onChangeIaConfig }: StartSettingsProps) {
  const random = iaConfig.startRandomFirstMove ?? true;
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

      <label>Inicio de partida — turnos aleatorios por lado</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
        <label htmlFor="ia-start-early-l" title="Número de primeras jugadas de L que serán 100% aleatorias">L — Turnos 1..N aleatorios</label>
        <input
          id="ia-start-early-l"
          type="number"
          min={0}
          max={10}
          step={1}
          value={Math.max(0, Math.min(10, iaConfig.startEarlyRandomL ?? 2))}
          onChange={(e) => onChangeIaConfig({ startEarlyRandomL: Math.max(0, Math.min(10, Number(e.target.value))) })}
          style={{ width: 90 }}
        />
        <label htmlFor="ia-start-early-d" title="Número de primeras jugadas de D que serán 100% aleatorias">D — Turnos 1..N aleatorios</label>
        <input
          id="ia-start-early-d"
          type="number"
          min={0}
          max={10}
          step={1}
          value={Math.max(0, Math.min(10, iaConfig.startEarlyRandomD ?? 2))}
          onChange={(e) => onChangeIaConfig({ startEarlyRandomD: Math.max(0, Math.min(10, Number(e.target.value))) })}
          style={{ width: 90 }}
        />
      </div>
    </>
  );
}

