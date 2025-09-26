export interface KPIsProps {
  nodes: number;
  elapsedMs: number;
  nps: number;
  currentLabel: string;
}

export default function KPIs({ nodes, elapsedMs, nps, currentLabel }: KPIsProps) {
  return (
    <div className="ia-panel__kpis" aria-label="Métricas">
      <span className="kpi"><strong>Nodos</strong> {(nodes || 0).toLocaleString()}</span>
      <span className="kpi"><strong>Tiempo</strong> {((elapsedMs || 0) / 1000).toFixed(2)} s</span>
      <span className="kpi"><strong>NPS</strong> {Math.round(nps || 0).toLocaleString()}</span>
      <span className="kpi kpi--muted"><strong>Turno</strong> {currentLabel}</span>
    </div>
  );
}

