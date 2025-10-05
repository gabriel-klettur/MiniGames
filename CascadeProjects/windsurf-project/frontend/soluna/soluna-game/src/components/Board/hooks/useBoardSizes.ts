import { useEffect, useRef, useState } from 'react';

export interface BoardSizes {
  w: number;
  h: number;
  token: number;
  stackStep: number;
  maxDiscs: number;
  mergeFactor: number;
  dropHighlight: boolean;
  freeMove: boolean;
  curveEnabled: boolean;
  curveBend: number;
  curveUp: boolean;
  lingerMs: number;
}

export function useBoardSizes() {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const ellipseRef = useRef<HTMLDivElement | null>(null);
  const [sizes, setSizes] = useState<BoardSizes>({
    w: 0,
    h: 0,
    token: 0,
    stackStep: 18,
    maxDiscs: 10,
    mergeFactor: 0.6,
    dropHighlight: true,
    freeMove: true,
    curveEnabled: true,
    curveBend: 0.22,
    curveUp: false,
    lingerMs: 250,
  });

  useEffect(() => {
    const el = fieldRef.current;
    const ellipse = ellipseRef.current;
    if (!el || !ellipse) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(ellipse);
      const tokenStr = cs.getPropertyValue('--token-size').trim();
      const token = tokenStr.endsWith('px') ? parseFloat(tokenStr) : parseFloat(tokenStr) || 56;
      const stepStr = cs.getPropertyValue('--stack-step').trim();
      const stackStep = stepStr.endsWith('px') ? parseFloat(stepStr) : parseFloat(stepStr) || 18;
      const maxDiscs = parseInt(cs.getPropertyValue('--max-discs').trim() || '10', 10) || 10;
      const mergeFactor = parseFloat(cs.getPropertyValue('--merge-threshold-factor').trim() || '0.6') || 0.6;
      const dropHighlight = (parseFloat(cs.getPropertyValue('--drop-highlight').trim() || '1') || 0) > 0;
      const freeMove = (parseFloat(cs.getPropertyValue('--free-move').trim() || '1') || 0) > 0;
      const curveEnabled = (parseFloat(cs.getPropertyValue('--flight-curve-enabled').trim() || '1') || 0) > 0;
      const curveBend = parseFloat(cs.getPropertyValue('--flight-curve-bend').trim() || '0.22') || 0.22;
      const curveUp = (parseFloat(cs.getPropertyValue('--flight-curve-up').trim() || '0') || 0) > 0;
      const lingerMs = parseFloat(cs.getPropertyValue('--flight-linger-ms').trim() || '250') || 250;
      setSizes({ w: rect.width, h: rect.height, token, stackStep, maxDiscs, mergeFactor, dropHighlight, freeMove, curveEnabled, curveBend, curveUp, lingerMs });
    });
    ro.observe(el);
    ro.observe(ellipse);
    return () => ro.disconnect();
  }, []);

  return { fieldRef, ellipseRef, sizes } as const;
}
