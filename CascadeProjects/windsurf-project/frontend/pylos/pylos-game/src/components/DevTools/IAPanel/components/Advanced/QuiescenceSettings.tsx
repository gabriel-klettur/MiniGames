import type { AIAdvancedConfig } from '../../types';
import { useI18n } from '../../../../../i18n';

export interface QuiescenceSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function QuiescenceSettings({ iaConfig, onChangeIaConfig }: QuiescenceSettingsProps) {
  const { t } = useI18n();
  return (
    <>
      <label>{t.iaPanel.quiescence}</label>
      <div>
        <input id="ia-q" type="checkbox" checked={iaConfig.quiescence} onChange={(e) => onChangeIaConfig({ quiescence: e.target.checked })} />
        <label htmlFor="ia-q" style={{ marginLeft: 6 }}>{t.iaPanel.enabled}</label>
      </div>

      <label>{t.iaPanel.qDepthMax}</label>
      <div>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={iaConfig.qDepthMax}
          onChange={(e) => onChangeIaConfig({ qDepthMax: Number(e.target.value) })}
        />
        <span style={{ marginLeft: 8 }}>{iaConfig.qDepthMax}</span>
      </div>

      <label>{t.iaPanel.qChildrenPerNode}</label>
      <div>
        <input
          type="range"
          min={1}
          max={128}
          step={1}
          value={iaConfig.qNodeCap}
          onChange={(e) => onChangeIaConfig({ qNodeCap: Number(e.target.value) })}
        />
        <span style={{ marginLeft: 8 }}>{iaConfig.qNodeCap}</span>
      </div>

      <label>{t.iaPanel.futilityMargin}</label>
      <div>
        <input
          type="range"
          min={0}
          max={1000}
          step={10}
          value={iaConfig.futilityMargin}
          onChange={(e) => onChangeIaConfig({ futilityMargin: Number(e.target.value) })}
        />
        <span style={{ marginLeft: 8 }}>{iaConfig.futilityMargin}</span>
      </div>
    </>
  );
}

