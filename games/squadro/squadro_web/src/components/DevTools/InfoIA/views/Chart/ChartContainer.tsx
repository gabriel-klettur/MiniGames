import type { Dataset } from '../../types';

interface ChartContainerProps { datasets: Dataset[] }

// Dependency-free: muestra promedio por dataset y cantidad de registros
export default function ChartContainer({ datasets }: ChartContainerProps) {
  const avgs = datasets.map((d) => (d.records.length ? d.records.reduce((a, b) => a + (b?.durationMs || 0), 0) / d.records.length : 0));
  const maxAvg = Math.max(1, ...avgs);
  const stats = datasets.map((ds, i) => ({
    id: ds.id,
    name: ds.name,
    color: ds.color,
    count: ds.records.length,
    avg: avgs[i] || 0,
    ratio: Math.min(1, (avgs[i] || 0) / maxAvg),
  }));

  const total = stats.reduce((a, s) => a + s.count, 0);
  const overallAvg = (() => {
    const totMs = datasets.reduce((sum, ds) => sum + ds.records.reduce((a, r) => a + (r?.durationMs || 0), 0), 0);
    return total ? (totMs / total) : 0;
  })();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] text-neutral-300" title="Resumen — Promedio de duración global y cantidad total de registros en todos los datasets.">
        <div className="font-medium" title="Resumen de datasets cargados">Resumen</div>
        <div className="inline-flex items-center gap-3 font-mono">
          <span title="N — Cantidad total de partidas consideradas en los gráficos."><strong>N</strong> {total.toLocaleString()}</span>
          <span title="avg — Promedio de duración (ms) ponderado por partidas."><strong>avg</strong> {Math.round(overallAvg).toLocaleString()} ms</span>
        </div>
      </div>
      {stats.map((s) => (
        <div key={s.id} className="flex items-center gap-2">
          <div className="w-36 text-xs truncate" title={`${s.name} — Nombre del dataset (serie) mostrado en los gráficos.`}>{s.name}</div>
          <div className="relative h-3 flex-1 rounded-md border border-neutral-700 bg-neutral-900 overflow-hidden" title="Barra — Proporción del promedio de este dataset respecto al máximo (100%).">
            <div className="absolute inset-y-0 left-0 rounded-md transition-[width] duration-150 ease-out" style={{ width: `${Math.round(s.ratio * 100)}%`, background: s.color }} title={`Ratio: ${Math.round(s.ratio*100)}%`} />
          </div>
          <div className="w-28 text-right text-[11px] font-mono text-neutral-200">
            <span className="mr-2" title="N — Cantidad de partidas en este dataset.">{s.count.toLocaleString()}x</span>
            <span title="avg — Promedio de duración (ms) de este dataset.">{Math.round(s.avg).toLocaleString()} ms</span>
          </div>
        </div>
      ))}
    </div>
  );
}
