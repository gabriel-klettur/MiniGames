import { useEffect, useRef, useState } from 'react';

/**
 * Observe container width and compute a height suitable for the chart.
 * Height scales with width but is clamped for readability.
 */
export function useChartResize() {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const compute = (w: number) => {
      const width = Math.max(320, Math.floor(w));
      const height = Math.max(260, Math.min(560, Math.round(width * 0.5)));
      setWidth(width);
      setHeight(height);
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

  return { boxRef, width, height };
}
