import { useI18n } from '../../../../../i18n';

export function BookSettings(props: { bookEnabled: boolean; onBookEnabledChange: (v: boolean) => void }) {
  const { t } = useI18n();
  const { bookEnabled, onBookEnabledChange } = props;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <label className="label" htmlFor="infoia-book" title={t.infoIA.bookTitle}>{t.infoIA.book}</label>
      <input id="infoia-book" type="checkbox" checked={!!bookEnabled} onChange={(e) => onBookEnabledChange(e.target.checked)} aria-checked={!!bookEnabled} title={t.infoIA.bookToggleTitle} />
    </div>
  );
}

