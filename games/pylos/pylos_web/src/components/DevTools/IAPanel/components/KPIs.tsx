import { useI18n } from '../../../../i18n';

export interface KPIsProps {
  nodes: number;
  elapsedMs: number;
  nps: number;
  currentLabel: string;
}

export default function KPIs({ nodes, elapsedMs, nps, currentLabel }: KPIsProps) {
  const { t } = useI18n();
  return (
    <div className="ia-panel__kpis" aria-label={t.iaPanel.metrics}>
      <span className="kpi"><strong>{t.iaPanel.nodes}</strong> {(nodes || 0).toLocaleString()}</span>
      <span className="kpi"><strong>{t.iaPanel.timeLabel}</strong> {((elapsedMs || 0) / 1000).toFixed(2)} s</span>
      <span className="kpi"><strong>{t.iaPanel.nps}</strong> {Math.round(nps || 0).toLocaleString()}</span>
      <span className="kpi kpi--muted"><strong>{t.iaPanel.turn}</strong> {currentLabel}</span>
    </div>
  );
}

