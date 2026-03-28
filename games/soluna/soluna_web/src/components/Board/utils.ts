// Utilities for Board: measurements, clamping, and coordinate helpers
import type { RefObject } from 'react';

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function pointToNormalized(fieldRef: RefObject<HTMLDivElement | null>, clientX: number, clientY: number): { x: number; y: number } {
  const el = fieldRef.current;
  if (!el) return { x: 0.5, y: 0.5 };
  const rect = el.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
}

export function getTokenCenterPxById(fieldRef: RefObject<HTMLDivElement | null>, id: string): { x: number; y: number } | null {
  const field = fieldRef.current;
  if (!field) return null;
  const el = field.querySelector<HTMLButtonElement>(`.token[data-id="${id}"]`);
  if (!el) return null;
  const fieldRect = field.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 - fieldRect.left, y: r.top + r.height / 2 - fieldRect.top };
}

export function getTokenCenterNorm(fieldRef: RefObject<HTMLDivElement | null>, id: string): { x: number; y: number } | null {
  const field = fieldRef.current;
  if (!field) return null;
  const el = field.querySelector<HTMLButtonElement>(`.token[data-id="${id}"]`);
  if (!el) return null;
  const fieldRect = field.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2 - fieldRect.left;
  const cy = r.top + r.height / 2 - fieldRect.top;
  if (fieldRect.width <= 0 || fieldRect.height <= 0) return null;
  return { x: clamp(cx / fieldRect.width, 0, 1), y: clamp(cy / fieldRect.height, 0, 1) };
}

export interface LastSelectedSnapshot {
  id: string;
  px: { x: number; y: number };
  norm: { x: number; y: number };
}

export function getOriginCenters(
  fieldRef: RefObject<HTMLDivElement | null>,
  lastSelected: LastSelectedSnapshot | null,
  sourceId: string,
  targetId: string
) {
  const fromPxSel = lastSelected && lastSelected.id === sourceId ? lastSelected.px : getTokenCenterPxById(fieldRef, sourceId) || null;
  const fromNormSel = lastSelected && lastSelected.id === sourceId ? lastSelected.norm : getTokenCenterNorm(fieldRef, sourceId) || null;
  const toPx = getTokenCenterPxById(fieldRef, targetId) || null;
  const toNorm = getTokenCenterNorm(fieldRef, targetId) || null;
  return {
    fromPx: fromPxSel || undefined,
    toPx: toPx || undefined,
    fromNorm: fromNormSel || undefined,
    toNorm: toNorm || undefined,
  } as {
    fromPx?: { x: number; y: number };
    toPx?: { x: number; y: number };
    fromNorm?: { x: number; y: number };
    toNorm?: { x: number; y: number };
  };
}
