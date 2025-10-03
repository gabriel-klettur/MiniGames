import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { GameState } from '../../../game/types';
import type { BoardSizes } from './useBoardSizes';
import { getTokenCenterPxById } from '../utils';

// Small adjustable offset applied to the destination of the merge flight (in pixels)
// Positive x moves the landing point to the right; positive y moves it down.
const DEST_OFFSET_PX = { x: 8, y: 8};

interface FlightPx {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

interface UseMergeFlightArgs {
  state: GameState;
  sizes: BoardSizes;
  fieldRef: RefObject<HTMLDivElement | null>;
}

export function useMergeFlight({ state, sizes, fieldRef }: UseMergeFlightArgs) {
  const [flightRunning, setFlightRunning] = useState(false);
  const [flightPx, setFlightPx] = useState<FlightPx | null>(null);
  const flightRef = useRef<HTMLDivElement | null>(null);

  const supportsMotionPath = useMemo(() => {
    try {
      // @ts-ignore
      if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
      // @ts-ignore
      return CSS.supports('offset-path', 'path("M 0 0 Q 10 10 20 0")') || CSS.supports('-webkit-offset-path', 'path("M 0 0 Q 10 10 20 0")');
    } catch {
      return false;
    }
  }, []);

  // Trigger and manage flight animation when a merge occurs
  useEffect(() => {
    if (!state.mergeFx || !fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const start = state.mergeFx.fromPx
      ? { x: state.mergeFx.fromPx.x, y: state.mergeFx.fromPx.y }
      : { x: state.mergeFx.from.x * rect.width, y: state.mergeFx.from.y * rect.height };
    let end = state.mergeFx.toPx
      ? { x: state.mergeFx.toPx.x, y: state.mergeFx.toPx.y }
      : getTokenCenterPxById(fieldRef, state.mergeFx.mergedId);
    if (!end) {
      end = { x: state.mergeFx.to.x * rect.width, y: state.mergeFx.to.y * rect.height };
    }
    // Apply visual offset so the landing appears slightly to the right (and/or down)
    end = { x: end.x + DEST_OFFSET_PX.x, y: end.y + DEST_OFFSET_PX.y };
    setFlightPx({ start, end });
    setFlightRunning(false);
    const raf1 = requestAnimationFrame(() => {
      // Recompute the precise end using the actual DOM position of the merged token
      const preciseEndRaw = getTokenCenterPxById(fieldRef, state.mergeFx!.mergedId)
        || { x: state.mergeFx!.to.x * rect.width, y: state.mergeFx!.to.y * rect.height };
      const preciseEnd = { x: preciseEndRaw.x + DEST_OFFSET_PX.x, y: preciseEndRaw.y + DEST_OFFSET_PX.y };
      setFlightPx({ start, end: preciseEnd });
      try { void flightRef.current?.getBoundingClientRect(); } catch {}
      const raf2 = requestAnimationFrame(() => setFlightRunning(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [state.mergeFx, sizes.w, sizes.h, fieldRef]);

  // Reset local flight state when effect clears
  useEffect(() => {
    if (!state.mergeFx) {
      setFlightPx(null);
      setFlightRunning(false);
    }
  }, [state.mergeFx]);

  // Precompute a curved motion-path for the current flight (quadratic Bezier)
  const curvePath = useMemo(() => {
    if (!flightPx) return undefined as string | undefined;
    const dx = flightPx.end.x - flightPx.start.x;
    const dy = flightPx.end.y - flightPx.start.y;
    const dist = Math.hypot(dx, dy);
    if (!isFinite(dist) || dist < 1) return undefined;
    const mx = dx / 2;
    const my = dy / 2;
    let nx = -dy;
    let ny = dx;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const nlen = Math.hypot(nx, ny) || 1;
    const bend = Math.min(180, Math.max(40, dist * sizes.curveBend));
    const cx = mx + (nx / nlen) * bend;
    const cy = my + (ny / nlen) * bend;
    const half = Math.max(0, sizes.token / 2);
    const sx = half;
    const sy = half;
    const ex = half + dx;
    const ey = half + dy;
    const c1x = half + cx;
    const c1y = half + cy;
    return `path("M ${sx} ${sy} Q ${c1x} ${c1y} ${ex} ${ey}")`;
  }, [flightPx, sizes.token, sizes.curveBend]);

  return { flightRunning, flightPx, flightRef, supportsMotionPath, curvePath } as const;
}
