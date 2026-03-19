import type { AIAdvancedConfig } from '../../types';
import { useI18n } from '../../../../../i18n';

export interface BookSettingsProps {
  iaConfig: AIAdvancedConfig;
  onChangeIaConfig: (patch: Partial<AIAdvancedConfig>) => void;
}

export default function BookSettings({ iaConfig, onChangeIaConfig }: BookSettingsProps) {
  const { t } = useI18n();
  const mode = iaConfig.bookMode ?? 'auto';
  const phase = iaConfig.bookPhase ?? 'aperturas';
  const basePath = iaConfig.bookBasePath ?? '/books';
  // UI deshabilitada por petición: el uso de books debe aparecer desactivado
  const uiDisabled = true;
  return (
    <>
      <label>{t.iaPanel.openingBook}</label>
      <div>
        <input id="ia-book" type="checkbox" checked={iaConfig.bookEnabled} onChange={(e) => onChangeIaConfig({ bookEnabled: e.target.checked })} disabled={uiDisabled} />
        <label htmlFor="ia-book" style={{ marginLeft: 6 }}>{t.iaPanel.enabled}</label>
      </div>

      <label>{t.iaPanel.mode}</label>
      <div>
        <select
          id="ia-book-mode"
          value={mode}
          onChange={(e) => onChangeIaConfig({ bookMode: e.target.value as any })}
          disabled={uiDisabled}
        >
          <option value="auto">{t.iaPanel.modeAuto}</option>
          <option value="manual">{t.iaPanel.modeManual}</option>
        </select>
      </div>

      {mode === 'auto' && (
        <>
          <label>{t.iaPanel.phase}</label>
          <div>
            <select
              id="ia-book-phase"
              value={phase}
              onChange={(e) => onChangeIaConfig({ bookPhase: e.target.value as any })}
              disabled={uiDisabled}
            >
              <option value="aperturas">{t.iaPanel.phaseOpenings}</option>
              <option value="medio">{t.iaPanel.phaseMidgame}</option>
              <option value="cierres">{t.iaPanel.phaseEndgame}</option>
            </select>
          </div>
          <label>{t.iaPanel.basePath}</label>
          <div>
            <input
              id="ia-book-base"
              type="text"
              value={basePath}
              onChange={(e) => onChangeIaConfig({ bookBasePath: e.target.value })}
              placeholder="/books"
              style={{ width: 260 }}
              disabled={uiDisabled}
            />
          </div>
        </>
      )}

      {mode === 'manual' && (
        <>
          <label>{t.iaPanel.bookUrl}</label>
          <div>
            <input
              id="ia-book-url"
              type="text"
              value={iaConfig.bookUrl}
              onChange={(e) => onChangeIaConfig({ bookUrl: e.target.value })}
              placeholder="/aperturas_book.json"
              style={{ width: 260 }}
              disabled={uiDisabled}
            />
          </div>
        </>
      )}
    </>
  );
}

