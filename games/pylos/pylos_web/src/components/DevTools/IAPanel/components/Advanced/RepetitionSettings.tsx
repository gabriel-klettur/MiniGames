import { useState } from 'react';
import type { AIAdvancedConfig } from '../../types';
import { getGlobalEnabled, setGlobalEnabled } from '../../../../../utils/repetitionDb';
import { useI18n } from '../../../../../i18n';

export interface RepetitionSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function RepetitionSettings({ iaConfig, onChangeIaConfig }: RepetitionSettingsProps) {
  const { t } = useI18n();
  const [globalAvoidEnabled, setGlobalAvoidEnabled] = useState<boolean>(() => getGlobalEnabled());
  return (
    <>
      <label>{t.iaPanel.avoidRepetitionsGlobal}</label>
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
        <label htmlFor="ia-global-avoid-enabled" style={{ marginLeft: 6 }}>{t.iaPanel.protocolActive}</label>
      </div>

      <label>{t.iaPanel.avoidRepetitionsRoot}</label>
      <div>
        <input id="ia-avoid-rep" type="checkbox" checked={iaConfig.avoidRepeats ?? true} onChange={(e) => onChangeIaConfig({ avoidRepeats: e.target.checked })} />
        <label htmlFor="ia-avoid-rep" style={{ marginLeft: 6 }}>{t.iaPanel.enabled}</label>
      </div>

      <label>{t.iaPanel.maxRepetitions}</label>
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

      <label>{t.iaPanel.repetitionPenalty}</label>
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

