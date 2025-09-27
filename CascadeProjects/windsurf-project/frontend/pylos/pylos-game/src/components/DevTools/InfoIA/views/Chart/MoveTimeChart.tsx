import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { niceStep } from '../../utils/chart';

export type PerMove = {
  elapsedMs?: number;
};

type Props = {
  perMoves: PerMove[];
};

/**
 * Small responsive SVG chart showing time per move.
 * X axis: move index (1..N)
 * Y axis: time in seconds for that move.
 */
export default function MoveTimeChart({ perMoves }: Props) {
  const valuesSec = useMemo(() => {
    const arr = (perMoves || []).map((m) => Math.max(0, (m?.elapsedMs ?? 0) / 1000));
    return arr;
  }, [perMoves]);

  const hasData = valuesSec.length > 0 && valuesSec.some((v) => v > 0);
  if (!hasData) return null;

  // Compute outlier threshold using IQR; fallback to mean+3*std if IQR≈0
  const { thresholdSec, outlierMask } = useMemo(() => {
    const n = valuesSec.length;
    if (n < 5) return { thresholdSec: null as number | null, outlierMask: new Array(n).fill(false) as boolean[] };
    const sorted = [...valuesSec].sort((a, b) => a - b);
    const quantile = (arr: number[], p: number) => {
      const idx = (arr.length - 1) * p;
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return arr[lo];
      const h = idx - lo;
      return arr[lo] * (1 - h) + arr[hi] * h;
    };
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    const iqr = q3 - q1;
    let thr: number;
    if (iqr > 1e-9) {
      thr = q3 + 1.5 * iqr;
    } else {
      // Fallback: mean + 3*std (if std~0, set threshold to +Infinity to avoid false positives)
      const mean = valuesSec.reduce((a, b) => a + b, 0) / n;
      const variance = valuesSec.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / n;
      const std = Math.sqrt(Math.max(0, variance));
      thr = std > 1e-9 ? mean + 3 * std : Number.POSITIVE_INFINITY;
    }
    const mask = valuesSec.map((v) => v > thr);
    // If no outliers found, still expose threshold for potential guide line (may be > max)
    return { thresholdSec: Number.isFinite(thr) ? thr : null, outlierMask: mask };
  }, [valuesSec]);

  // Responsive box
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [W, setW] = useState<number>(0);
  const [H, setH] = useState<number>(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const compute = (w: number) => {
      const width = Math.max(320, Math.floor(w));
      // Make this chart more compact than the global chart
      const height = Math.max(140, Math.min(320, Math.round(width * 0.4)));
      setW(width);
      setH(height);
    };
    compute(el.clientWidth || el.getBoundingClientRect().width || 0);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const w = entry.contentRect?.width ?? el.clientWidth;
      compute(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Layout
  const isSmall = W < 560;
  const margin = isSmall
    ? { top: 28, right: 18, bottom: 32, left: 48 }
    : { top: 30, right: 20, bottom: 38, left: 56 };
  const innerW = Math.max(1, W - margin.left - margin.right);
  const innerH = Math.max(1, H - margin.top - margin.bottom);

  // Scales (include threshold to show the guide line when within range)
  const maxY = Math.max(1, ...valuesSec, thresholdSec ?? 0);
  const step = niceStep(0, maxY, 5);
  const niceMaxY = Math.ceil(maxY / step) * step;
  const ticksY: number[] = [];
  for (let y = 0; y <= niceMaxY + 1e-9; y += step) ticksY.push(Number(y.toFixed(6)));
  const yScale = (s: number) => H - margin.bottom - innerH * (s / (niceMaxY || 1));

  const N = valuesSec.length;
  const xForIndex = (i: number) => margin.left + (N <= 1 ? innerW / 2 : (i * innerW) / (N - 1));

  // X ticks: decimate to avoid clutter
  const targetXTicks = 8;
  const xStep = Math.max(1, Math.round(N / targetXTicks));
  const xTicks: number[] = [];
  for (let i = 0; i < N; i += xStep) xTicks.push(i);
  if (xTicks[xTicks.length - 1] !== N - 1) xTicks.push(N - 1);

  const pathD = useMemo(() => {
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < N; i++) {
      const x = xForIndex(i);
      const y = yScale(valuesSec[i]);
      pts.push({ x, y });
    }
    if (pts.length === 0) return '';
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) d += ` L${pts[i].x},${pts[i].y}`;
    return d;
  }, [N, valuesSec]);

  const containerStyle: CSSProperties = { width: '100%', display: 'block' };

  return (
    <div ref={boxRef} style={containerStyle} aria-label="Gráfico: tiempo por jugada (s)">
      {W > 0 && H > 0 && (
        <svg width={W} height={H} role="img" aria-label="Tiempo por jugada">
          {/* Grid Y and labels */}
          <g aria-hidden="true">
            {ticksY.map((t, i) => (
              <g key={i}>
                <line x1={margin.left} y1={yScale(t)} x2={W - margin.right} y2={yScale(t)} stroke="#334155" strokeDasharray="2,4" />
                <text x={margin.left - 8} y={yScale(t) + 4} textAnchor="end" fontSize={10} fill="#ffffff">
                  {t % 1 === 0 ? `${t}s` : `${t.toFixed(1)}s`}
                </text>
              </g>
            ))}
            <text transform={`translate(${margin.left - 40}, ${margin.top + innerH / 2}) rotate(-90)`} textAnchor="middle" fontSize={10} opacity={0.9} fill="#ffffff">Segundos (s)</text>
          </g>

          {/* X ticks */}
          <g aria-hidden="true">
            {xTicks.map((i) => (
              <g key={i} transform={`translate(${xForIndex(i)}, 0)`}>
                <line y1={H - margin.bottom} y2={H - margin.bottom + 4} stroke="#64748b" />
                <text y={H - margin.bottom + 16} textAnchor="middle" fontSize={10} fill="#ffffff">{i + 1}</text>
              </g>
            ))}
            <text x={W - margin.right} y={H - 6} textAnchor="end" fontSize={10} opacity={0.9} fill="#ffffff">Jugada</text>
          </g>

          {/* Threshold line for outliers (IQR) */}
          {typeof thresholdSec === 'number' && isFinite(thresholdSec) && thresholdSec <= niceMaxY && thresholdSec >= 0 && (
            <g>
              <line
                x1={margin.left}
                x2={W - margin.right}
                y1={yScale(thresholdSec)}
                y2={yScale(thresholdSec)}
                stroke="#ef4444"
                strokeDasharray="4,4"
                opacity={0.85}
              />
              <text
                x={W - margin.right}
                y={yScale(thresholdSec) - 6}
                textAnchor="end"
                fontSize={10}
                fill="#ef4444"
              >Umbral atípicos (IQR)</text>
            </g>
          )}

          {/* Line */}
          <path d={pathD} fill="none" stroke="#22c55e" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          <g>
            {valuesSec.map((v, i) => {
              const cx = xForIndex(i);
              const cy = yScale(v);
              const isOutlier = !!outlierMask[i] && (typeof thresholdSec === 'number' ? v > thresholdSec : false);
              return (
                <g key={i}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isOutlier ? 4.4 : 3.2}
                    fill={isOutlier ? '#ef4444' : '#22c55e'}
                    stroke="#0b1220"
                    strokeWidth={1}
                  />
                  <title>{`#${i + 1}: ${v.toFixed(3)}s${isOutlier ? ' · atípico' : ''}`}</title>
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
}
