import { useI18n } from '../../../../i18n';

export interface HeaderProps {
  title?: string;
  moving?: boolean;
  busy?: boolean;
  progressDepth?: number | null;
}

export default function Header({ title, moving = false, busy = false, progressDepth = null }: HeaderProps) {
  const { t } = useI18n();
  const displayTitle = title ?? t.iaPanel.title;
  return (
    <div className="ia-panel__header">
      <h3 className="ia-panel__title">{displayTitle}</h3>
      <div className="ia-panel__status">
        {moving && <span className="kpi kpi--accent" aria-live="polite">{t.iaPanel.moving}</span>}
        {busy && !moving && <span className="kpi">{t.iaPanel.thinking}{typeof progressDepth === 'number' ? ` d${progressDepth}` : ''}</span>}
        {!busy && !moving && <span className="kpi kpi--muted">{t.iaPanel.waiting}</span>}
      </div>
    </div>
  );
}

