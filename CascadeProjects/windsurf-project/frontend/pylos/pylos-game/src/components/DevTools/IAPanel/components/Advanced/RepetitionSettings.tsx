import { useState } from 'react';
import type { AIAdvancedConfig } from '../../types';
import { getGlobalEnabled, setGlobalEnabled } from '../../../../../utils/repetitionDb';

export interface RepetitionSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function RepetitionSettings({ iaConfig, onChangeIaConfig }: RepetitionSettingsProps) {
  const [globalAvoidEnabled, setGlobalAvoidEnabled] = useState<boolean>(() => getGlobalEnabled());
  return (
    <>
      <label>Evitar repeticiones (entre partidas, global)</label>
      <div>
        <input
          id="ia-global-avoid-enabled"
          type="checkbox"
          checked={!!globalAvoidEnabled}
          onChange={(e) => {
            const v = !!e.target.checked;
            setGlobalAvoidEnabled(v);
            try { setGlobalEnabled(v); } catch {}
          }}
        />
        <label htmlFor="ia-global-avoid-enabled" style={{ marginLeft: 6 }}>Protocolo activo</label>
      </div>

      <label>Evitar repeticiones (raíz)</label>
      <div>
        <input id="ia-avoid-rep" type="checkbox" checked={iaConfig.avoidRepeats ?? true} onChange={(e) => onChangeIaConfig({ avoidRepeats: e.target.checked })} />
        <label htmlFor="ia-avoid-rep" style={{ marginLeft: 6 }}>Activado</label>
      </div>

      <label>Repeticiones máx. (evitar ≥)</label>
      <div>
        <input
          id="ia-repeat-max"
          type="number"
          min={1}
          max={10}
          step={1}
          value={Math.max(1, Math.min(10, iaConfig.repeatMax ?? 3))}
          onChange={(e) => onChangeIaConfig({ repeatMax: Math.max(1, Math.min(10, Number(e.target.value))) })}
          style={{ width: 80 }}
        />
      </div>

      <label>Penalización por repetición</label>
      <div>
        <input
          id="ia-avoid-penalty"
          type="number"
          min={0}
          max={500}
          step={5}
          value={Math.max(0, Math.min(500, iaConfig.avoidPenalty ?? 50))}
          onChange={(e) => onChangeIaConfig({ avoidPenalty: Math.max(0, Math.min(500, Number(e.target.value))) })}
          style={{ width: 90 }}
        />
      </div>
    </>
  );
}

