import type { AIAdvancedConfig } from '../../types';

export interface SearchSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function SearchSettings({ iaConfig, onChangeIaConfig }: SearchSettingsProps) {
  return (
    <>
      <div style={{ gridColumn: '1 / -1', fontWeight: 600, opacity: 0.8 }}>Búsqueda</div>
      <label>PVS (Principal Variation Search)</label>
      <div>
        <input id="ia-pvs" type="checkbox" checked={iaConfig.pvsEnabled ?? true} onChange={(e) => onChangeIaConfig({ pvsEnabled: e.target.checked })} />
        <label htmlFor="ia-pvs" style={{ marginLeft: 6 }}>Activado</label>
      </div>
      <label>Ventanas de aspiración</label>
      <div>
        <input id="ia-asp" type="checkbox" checked={iaConfig.aspirationEnabled ?? true} onChange={(e) => onChangeIaConfig({ aspirationEnabled: e.target.checked })} />
        <label htmlFor="ia-asp" style={{ marginLeft: 6 }}>Activado</label>
      </div>
      <label>Transposition Table (TT)</label>
      <div>
        <input id="ia-tt" type="checkbox" checked={iaConfig.ttEnabled ?? true} onChange={(e) => onChangeIaConfig({ ttEnabled: e.target.checked })} />
        <label htmlFor="ia-tt" style={{ marginLeft: 6 }}>Activado</label>
      </div>
    </>
  );
}

