import type { CSSProperties } from 'react';
import type { AggRow } from '../../utils/aggregates';
import { niceStep } from '../../utils/chart';

export type ChartAggDataset = {
  id?: string;
  name: string;
  color: string;
  aggregates: AggRow[];
};

type Props = {
  width: number;
  height: number;
  datasets: ChartAggDataset[];
};

export default function Chart({ width: W, height: H, datasets }: Props) {
  const hasAnyAgg = datasets.some((d) => d.aggregates.length > 0);
  if (!hasAnyAgg) {
    // Caller should handle empty state; this is a safe fallback.
    return null;
  }

  // Build union of depths
  const depthSet = new Set<number>();
  for (const d of datasets) for (const a of d.aggregates) depthSet.add(a.depth);
  const depths = Array.from(depthSet).sort((a, b) => a - b);

  // Chart dimensions and Y scale considering all datasets
  const isSmall = W < 560;
  const isMid = !isSmall && W < 860;
  const margin = isSmall
    ? { top: 62, right: 20, bottom: 52, left: 66 }
    : isMid
    ? { top: 68, right: 26, bottom: 58, left: 80 }
    : { top: 72, right: 32, bottom: 64, left: 90 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  let maxY = 1;
  for (const d of datasets) {
    for (const a of d.aggregates) {
      maxY = Math.max(maxY, a.avgSec, a.minSec, a.maxSec);
    }
  }

  const targetTicks = 5;
  const step = niceStep(0, maxY, targetTicks);
  const niceMaxY = Math.ceil(maxY / step) * step;
  const ticksY: number[] = [];
  for (let y = 0; y <= niceMaxY + 1e-9; y += step) ticksY.push(Number(y.toFixed(6)));

  const idxOfDepth = (d: number) => depths.indexOf(d);
  const xForIndex = (i: number) => margin.left + (depths.length <= 1 ? innerW / 2 : (i * innerW) / (depths.length - 1));
  const yScale = (s: number) => H - margin.bottom - innerH * (s / (niceMaxY || 1));

  // Typography scaling
  const fsAxis = isSmall ? 10 : isMid ? 11 : 12;
  const fsLegend = isSmall ? 10 : 12;

  const pathFor = (aggs: AggRow[], key: keyof AggRow) => {
    const points: Array<{ x: number; y: number }> = [];
    for (const a of aggs) {
      const idx = idxOfDepth(a.depth);
      if (idx < 0) continue;
      const val = a[key] as number;
      const x = xForIndex(idx);
      const y = yScale(val);
      points.push({ x, y });
    }
    if (points.length === 0) return '';
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) d += ` L${points[i].x},${points[i].y}`;
    return d;
  };

  const containerStyle: CSSProperties = { display: 'contents' };

  return (
    <div style={containerStyle}>
      {W > 0 && H > 0 && (
        <>
          <svg width={W} height={H} role="img" aria-label="Gráfico comparativo de métricas por dificultad">
            <defs>
              <filter id="ds" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                <feOffset dy="1" result="offset" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.25" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode in="offset" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Legend */}
            {(() => {
              const itemW = 200;
              const cols = Math.max(1, Math.floor(innerW / itemW));
              const rows = Math.max(1, Math.ceil(datasets.length / cols));
              const legendY = margin.top - 20 - (rows - 1) * 18;
              return (
                <g transform={`translate(${margin.left}, ${legendY})`} aria-hidden="false">
                  {datasets.map((ds, i) => {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    const x = (innerW / cols) * col;
                    const y = row * 18;
                    return (
                      <g key={ds.id || ds.name} transform={`translate(${x}, ${y})`}>
                        <line x1={0} y1={-6} x2={36} y2={-6} stroke={ds.color} strokeWidth={3} />
                        <line x1={0} y1={2} x2={36} y2={2} stroke={ds.color} strokeWidth={2} strokeDasharray="6,4" opacity={0.9} />
                        <line x1={0} y1={10} x2={36} y2={10} stroke={ds.color} strokeWidth={2} strokeDasharray="2,5" opacity={0.9} />
                        <text x={48} y={2} alignmentBaseline="middle" className="mono" fontSize={fsLegend} fill="#e5e7eb">{ds.name}</text>
                      </g>
                    );
                  })}
                </g>
              );
            })()}

            {/* Horizontal grid and Y axis */}
            <g aria-hidden="true">
              {ticksY.map((t, i) => (
                <g key={i}>
                  <line x1={margin.left} y1={yScale(t)} x2={W - margin.right} y2={yScale(t)} stroke="#334155" strokeDasharray="2,4" />
                  <text x={margin.left - 8} y={yScale(t) + 4} textAnchor="end" fontSize={fsAxis} fill="#ffffff">{t % 1 === 0 ? `${t}s` : `${t.toFixed(1)}s`}</text>
                </g>
              ))}
              <text transform={`translate(${margin.left - 52}, ${margin.top + innerH / 2}) rotate(-90)`} textAnchor="middle" fontSize={fsLegend} opacity={0.9} fill="#ffffff">Segundos (s)</text>
            </g>

            {/* Vertical guides and X axis */}
            <g aria-hidden="true">
              {depths.map((d, i) => (
                <g key={d} transform={`translate(${xForIndex(i)}, 0)`}>
                  <line y1={margin.top} y2={H - margin.bottom} stroke="#1f2937" strokeOpacity={0.25} />
                  <line y1={H - margin.bottom} y2={H - margin.bottom + 6} stroke="#64748b" />
                  <text y={H - margin.bottom + 18} textAnchor="middle" fontSize={fsAxis} fill="#ffffff">Dificultad {d}</text>
                </g>
              ))}
              <text x={W - margin.right} y={H - 8} textAnchor="end" fontSize={fsLegend} opacity={0.9} fill="#ffffff">Dificultad</text>
            </g>

            {/* Dataset lines */}
            {datasets.map((ds) => (
              <g key={ds.id || ds.name}>
                <path d={pathFor(ds.aggregates, 'avgSec')} fill="none" stroke={ds.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} filter="url(#ds)" />
                {ds.aggregates.some((a) => a.minSec > 0) && (
                  <path d={pathFor(ds.aggregates, 'minSec')} fill="none" stroke={ds.color} strokeWidth={2} strokeDasharray="6,4" opacity={0.9} />
                )}
                {ds.aggregates.some((a) => a.maxSec > 0) && (
                  <path d={pathFor(ds.aggregates, 'maxSec')} fill="none" stroke={ds.color} strokeWidth={2} strokeDasharray="2,5" opacity={0.9} />
                )}
              </g>
            ))}

            {/* Points */}
            {datasets.map((ds) => (
              <g key={(ds.id || ds.name) + '-pts'}>
                {ds.aggregates.map((a) => {
                  const i = idxOfDepth(a.depth);
                  const cx = xForIndex(i);
                  const pts = [
                    { key: 'avgSec' as const, val: a.avgSec, r: 5, strokeW: 1.2 },
                    ...(a.minSec > 0 ? [{ key: 'minSec' as const, val: a.minSec, r: 4, strokeW: 1.0 }] : []),
                    ...(a.maxSec > 0 ? [{ key: 'maxSec' as const, val: a.maxSec, r: 4, strokeW: 1.0 }] : []),
                  ];
                  return (
                    <g key={`d${a.depth}`}>
                      {pts.map((p) => {
                        const cy = yScale(p.val);
                        return (
                          <g key={p.key} filter="url(#ds)">
                            <circle cx={cx} cy={cy} r={p.r} fill={ds.color} stroke="#0b1220" strokeWidth={p.strokeW} />
                            <circle cx={cx} cy={cy} r={p.r + 2} fill="none" stroke={ds.color} strokeOpacity={0.25} />
                            <title>{`${ds.name} · ${p.key === 'avgSec' ? 'Promedio' : p.key === 'minSec' ? 'Mín' : 'Máx'}: ${p.val.toFixed(3)}s @ Dificultad ${a.depth}`}</title>
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </g>
            ))}
          </svg>
        </>
      )}
    </div>
  );
}
