import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { GameState } from '../../../game/types';
import type { BoardSizes } from './useBoardSizes';
import { getTokenCenterPxById } from '../utils';

// Logging toggle aligned with store.tsx (localStorage key)
const LOG_LS_KEY = 'soluna:log:merges';
function shouldLog(): boolean {
  try {
    const raw = window.localStorage.getItem(LOG_LS_KEY);
    return raw == null ? true : raw !== '0';
  } catch {
    return true;
  }
}

// Destination offset for the merge flight (pixels).
// We only honor Y; X is deprecated and treated as 0 to ensure center landing.
function readDestOffsetPx(el: HTMLElement | null): { x: number; y: number } {
  try {
    if (!el) return { x: 0, y: 0 };
    const cs = getComputedStyle(el);
    const dy = parseFloat((cs.getPropertyValue('--flight-dest-offset-y') || '0').trim()) || 0;
    return { x: 0, y: dy };
  } catch {
    return { x: 0, y: 0 };
  }
}

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
    const destOffset = readDestOffsetPx(fieldRef.current);
    const start = state.mergeFx.fromPx
      ? { x: state.mergeFx.fromPx.x, y: state.mergeFx.fromPx.y }
      : { x: state.mergeFx.from.x * rect.width, y: state.mergeFx.from.y * rect.height };
    // Prefer the explicit pixel center of the target at dispatch time (toPx).
    // Otherwise, resolve to the current DOM center of the targetId (top of its stack),
    // and finally fall back to normalized coordinates.
    let end = state.mergeFx.toPx
      ? { x: state.mergeFx.toPx.x, y: state.mergeFx.toPx.y }
      : getTokenCenterPxById(fieldRef, state.mergeFx.targetId);
    if (!end) {
      end = { x: state.mergeFx.to.x * rect.width, y: state.mergeFx.to.y * rect.height };
    }
    // Compute lift so the flying HEAD lands at the final top level.
    // Levels to lift = baseH + sourceBelowCount.
    const mergedFinal = state.mergeFx.towersAfter.find(t => t.id === state.mergeFx!.mergedId) || null;
    const finalH = mergedFinal?.height ?? state.mergeFx.sourceStack.length;
    const baseH = Math.max(0, finalH - state.mergeFx.sourceStack.length);
    const sourceBelowCount = Math.max(0, state.mergeFx.sourceStack.length - 1);
    const liftLevels = baseH + sourceBelowCount;
    const liftPx = Math.max(0, sizes.stackStep * liftLevels);
    // Apply visual offset and the lift so the head lands at the final top level.
    end = { x: end.x + destOffset.x, y: end.y + destOffset.y - liftPx };
    setFlightPx({ start, end });
    setFlightRunning(false);
    if (shouldLog()) {
      try {
        const dt = Date.now() - (state.mergeFx.at || Date.now());
        console.groupCollapsed?.(`[Soluna] Flight prepared (dt ${dt}ms)`);
        console.log('fromPx?', !!state.mergeFx.fromPx, 'toPx?', !!state.mergeFx.toPx, 'destOffset:', destOffset);
        console.log('start(px):', start, 'end(px):', end);
        console.groupEnd?.();
      } catch {}
    }
    const raf1 = requestAnimationFrame(() => {
      // Recompute the precise end using the actual DOM position of the merged token
      // If we have toPx, keep using it to maintain exact center-to-center alignment.
      // Otherwise, try to locate the targetId's DOM center; if it no longer exists (re-render),
      // fall back to normalized target coordinates.
      const preciseEndRaw = (state.mergeFx!.toPx
        ? { x: state.mergeFx!.toPx.x, y: state.mergeFx!.toPx.y }
        : getTokenCenterPxById(fieldRef, state.mergeFx!.targetId))
        || { x: state.mergeFx!.to.x * rect.width, y: state.mergeFx!.to.y * rect.height };
      const mergedFinal2 = state.mergeFx!.towersAfter.find(t => t.id === state.mergeFx!.mergedId) || null;
      const finalH2 = mergedFinal2?.height ?? state.mergeFx!.sourceStack.length;
      const baseH2 = Math.max(0, finalH2 - state.mergeFx!.sourceStack.length);
      const sourceBelowCount2 = Math.max(0, state.mergeFx!.sourceStack.length - 1);
      const liftLevels2 = baseH2 + sourceBelowCount2;
      const liftPx2 = Math.max(0, sizes.stackStep * liftLevels2);
      const preciseEnd = { x: preciseEndRaw.x + destOffset.x, y: preciseEndRaw.y + destOffset.y - liftPx2 };
      setFlightPx({ start, end: preciseEnd });
      try { void flightRef.current?.getBoundingClientRect(); } catch {}
      const raf2 = requestAnimationFrame(() => setFlightRunning(true));
      if (shouldLog()) {
        try {
          const dt2 = Date.now() - (state.mergeFx!.at || Date.now());
          console.log(`[Soluna] Flight running start (dt ${dt2}ms)`);
        } catch {}
      }
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [state.mergeFx, sizes.w, sizes.h, fieldRef]);

  // Reset local flight state when effect clears
  useEffect(() => {
    if (!state.mergeFx) {
      if (shouldLog()) {
        try { console.log('[Soluna] Flight cleared'); } catch {}
      }
      setFlightPx(null);
      setFlightRunning(false);
    }
  }, [state.mergeFx]);

  // Precompute a motion-path for the current flight.
  // If curve is enabled, use quadratic Bezier; otherwise, a straight line.
  const curvePath = useMemo(() => {
    if (!flightPx) return undefined as string | undefined;
    const dx = flightPx.end.x - flightPx.start.x;
    const dy = flightPx.end.y - flightPx.start.y;
    const dist = Math.hypot(dx, dy);
    if (!isFinite(dist) || dist < 1) return undefined;
    // Path en coords del contenedor del body (top-left del elemento es 0,0),
    // desplazado por half para que el CENTRO del elemento siga el path.
    const half = Math.max(0, sizes.token / 2);
    const sx = half;
    const sy = half;
    const ex = half + dx;
    const ey = half + dy;
    if (!sizes.curveEnabled) {
      return `path("M ${sx} ${sy} L ${ex} ${ey}")`;
    }
    const mx = dx / 2;
    const my = dy / 2;
    let nx = -dy;
    let ny = dx;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const nlen = Math.hypot(nx, ny) || 1;
    const bend = Math.min(180, Math.max(40, dist * sizes.curveBend));
    const cx = mx + (nx / nlen) * bend;
    const cy = my + (ny / nlen) * bend;
    const c1x = half + cx;
    const c1y = half + cy;
    return `path("M ${sx} ${sy} Q ${c1x} ${c1y} ${ex} ${ey}")`;
  }, [flightPx, sizes.token, sizes.curveBend, sizes.curveEnabled]);

  return { flightRunning, flightPx, flightRef, supportsMotionPath, curvePath } as const;
}
