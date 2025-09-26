import type { AIAdvancedConfig } from '../../types';

export interface PerformanceSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function PerformanceSettings({ iaConfig, onChangeIaConfig }: PerformanceSettingsProps) {
  return (
    <>
      {/* --- Rendimiento --- */}
      <div style={{ gridColumn: '1 / -1', fontWeight: 600, opacity: 0.8, marginTop: 6 }}>Rendimiento</div>
      <label>Soportes precalculados</label>
      <div>
        <input
          id="ia-pre-supp"
          type="checkbox"
          checked={iaConfig.precomputedSupports ?? true}
          onChange={(e) => onChangeIaConfig({ precomputedSupports: e.target.checked })}
        />
        <label htmlFor="ia-pre-supp" style={{ marginLeft: 6 }}>Activado</label>
      </div>

      <label>Centro precalculado</label>
      <div>
        <input
          id="ia-pre-center"
          type="checkbox"
          checked={iaConfig.precomputedCenter ?? true}
          onChange={(e) => onChangeIaConfig({ precomputedCenter: e.target.checked })}
        />
        <label htmlFor="ia-pre-center" style={{ marginLeft: 6 }}>Activado</label>
      </div>
    </>
  );
}

