import type { AIAdvancedConfig } from '../../types';
import { useI18n } from '../../../../../i18n';

export interface StartSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function StartSettings({ iaConfig, onChangeIaConfig }: StartSettingsProps) {
  const { t } = useI18n();
  const random = iaConfig.startRandomFirstMove ?? true;
  const seedVal = iaConfig.startSeed ?? '';
  return (
    <>
      <label>{t.iaPanel.start}</label>
      <div>
        <input
          id="ia-start-random"
          type="checkbox"
          checked={random}
          onChange={(e) => onChangeIaConfig({ startRandomFirstMove: e.target.checked })}
        />
        <label htmlFor="ia-start-random" style={{ marginLeft: 6 }}>{t.iaPanel.randomFirstMove}</label>
      </div>

      <label>{t.iaPanel.seed}</label>
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
          placeholder={t.iaPanel.seedPlaceholder}
          style={{ width: 140 }}
          disabled={!random}
        />
      </div>

      <label>{t.iaPanel.earlyRandomTurns}</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
        <label htmlFor="ia-start-early-l">{t.iaPanel.lightRandomTurns}</label>
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
        <label htmlFor="ia-start-early-d">{t.iaPanel.darkRandomTurns}</label>
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

