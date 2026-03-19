import type { AIAdvancedConfig } from '../../types';
import { useI18n } from '../../../../../i18n';

export interface SearchSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function SearchSettings({ iaConfig, onChangeIaConfig }: SearchSettingsProps) {
  const { t } = useI18n();
  return (
    <>
      <div style={{ gridColumn: '1 / -1', fontWeight: 600, opacity: 0.8 }}>{t.iaPanel.search}</div>
      <label>{t.iaPanel.pvs}</label>
      <div>
        <input id="ia-pvs" type="checkbox" checked={iaConfig.pvsEnabled ?? true} onChange={(e) => onChangeIaConfig({ pvsEnabled: e.target.checked })} />
        <label htmlFor="ia-pvs" style={{ marginLeft: 6 }}>{t.iaPanel.enabled}</label>
      </div>
      <label>{t.iaPanel.aspirationWindows}</label>
      <div>
        <input id="ia-asp" type="checkbox" checked={iaConfig.aspirationEnabled ?? true} onChange={(e) => onChangeIaConfig({ aspirationEnabled: e.target.checked })} />
        <label htmlFor="ia-asp" style={{ marginLeft: 6 }}>{t.iaPanel.enabled}</label>
      </div>
      <label>{t.iaPanel.transpositionTable}</label>
      <div>
        <input id="ia-tt" type="checkbox" checked={iaConfig.ttEnabled ?? true} onChange={(e) => onChangeIaConfig({ ttEnabled: e.target.checked })} />
        <label htmlFor="ia-tt" style={{ marginLeft: 6 }}>{t.iaPanel.enabled}</label>
      </div>
    </>
  );
}

