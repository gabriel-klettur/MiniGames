import type { AIAdvancedConfig } from '../../types';
import { useI18n } from '../../../../../i18n';

export interface PerformanceSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function PerformanceSettings({ iaConfig, onChangeIaConfig }: PerformanceSettingsProps) {
  const { t } = useI18n();
  return (
    <>
      {/* --- Rendimiento --- */}
      <div style={{ gridColumn: '1 / -1', fontWeight: 600, opacity: 0.8, marginTop: 6 }}>{t.iaPanel.performance}</div>
      <label>{t.iaPanel.precomputedSupports}</label>
      <div>
        <input
          id="ia-pre-supp"
          type="checkbox"
          checked={iaConfig.precomputedSupports ?? true}
          onChange={(e) => onChangeIaConfig({ precomputedSupports: e.target.checked })}
        />
        <label htmlFor="ia-pre-supp" style={{ marginLeft: 6 }}>{t.iaPanel.enabled}</label>
      </div>

      <label>{t.iaPanel.precomputedCenter}</label>
      <div>
        <input
          id="ia-pre-center"
          type="checkbox"
          checked={iaConfig.precomputedCenter ?? true}
          onChange={(e) => onChangeIaConfig({ precomputedCenter: e.target.checked })}
        />
        <label htmlFor="ia-pre-center" style={{ marginLeft: 6 }}>{t.iaPanel.enabled}</label>
      </div>
    </>
  );
}

