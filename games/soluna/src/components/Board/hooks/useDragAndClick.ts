import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { canMerge } from '../../../game/rules';
import type { GameState } from '../../../game/types';
import { clamp, getOriginCenters, pointToNormalized, type LastSelectedSnapshot } from '../utils';
import type { BoardSizes } from './useBoardSizes';

interface UseDragAndClickArgs {
  state: GameState;
  dispatch: React.Dispatch<any>;
  sizes: BoardSizes;
  fieldRef: RefObject<HTMLDivElement | null>;
}

export function useDragAndClick({ state, dispatch, sizes, fieldRef }: UseDragAndClickArgs) {
  const [dragId, setDragId] = useState<string | null>(null);
  const dragStartRef = useRef<{ id: string; pos: { x: number; y: number } } | null>(null);
  const movedDuringDragRef = useRef(false);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const lastSelectedRef = useRef<LastSelectedSnapshot | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const pressingRef = useRef<{ id: string } | null>(null);
  const LONG_PRESS_MS = 220;

  // Keep lastSelectedRef in sync with current selection
  useEffect(() => {
    const selId = state.selectedId;
    const field = fieldRef.current;
    if (!selId || !field) {
      lastSelectedRef.current = null;
      return;
    }
    const el = field.querySelector<HTMLButtonElement>(`.token[data-id="${selId}"]`);
    if (!el) return;
    const fieldRect = field.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const px = { x: r.left + r.width / 2 - fieldRect.left, y: r.top + r.height / 2 - fieldRect.top };
    const norm = { x: clamp(px.x / Math.max(1, fieldRect.width), 0, 1), y: clamp(px.y / Math.max(1, fieldRect.height), 0, 1) };
    lastSelectedRef.current = { id: selId, px, norm };
  }, [state.selectedId, fieldRef]);

  const onCellClick = (id: string) => {
    if (dragId || movedDuringDragRef.current) return;
    if (!state.selectedId) {
      dispatch({ type: 'select', id });
      return;
    }
    if (state.selectedId === id) {
      return;
    }
    const source = state.towers.find(t => t.id === state.selectedId);
    const target = state.towers.find(t => t.id === id);
    if (!source || !target) return;
    if (canMerge(source, target)) {
      const { fromPx, toPx, fromNorm, toNorm } = getOriginCenters(fieldRef, lastSelectedRef.current, source.id, target.id);
      const fromC = fromNorm || { ...source.pos };
      const toC = toNorm || { ...target.pos };
      dispatch({ type: 'attempt-merge', sourceId: source.id, targetId: id, from: fromC, to: toC, fromPx, toPx });
    } else {
      dispatch({ type: 'select', id });
    }
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture?.(e.pointerId);
    if (!state.selectedId) {
      dispatch({ type: 'select', id });
      const field = fieldRef.current;
      if (field) {
        const fieldRect = field.getBoundingClientRect();
        const r = (el as HTMLElement).getBoundingClientRect();
        const px = { x: r.left + r.width / 2 - fieldRect.left, y: r.top + r.height / 2 - fieldRect.top };
        const norm = { x: clamp(px.x / Math.max(1, fieldRect.width), 0, 1), y: clamp(px.y / Math.max(1, fieldRect.height), 0, 1) };
        lastSelectedRef.current = { id, px, norm };
      }
    }
    movedDuringDragRef.current = false;
    pressingRef.current = { id };
    if (pressTimerRef.current != null) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressTimerRef.current = window.setTimeout(() => {
      if (pressingRef.current?.id === id && !dragId) {
        if (state.selectedId !== id) {
          dispatch({ type: 'select', id });
        }
        setDragId(id);
        const t = state.towers.find(tt => tt.id === id);
        if (t) dragStartRef.current = { id, pos: { x: t.pos.x, y: t.pos.y } };
      }
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent, id: string) => {
    if (dragId !== id) return;
    const pos = pointToNormalized(fieldRef, e.clientX, e.clientY);
    const minWH = Math.max(1, Math.min(sizes.w, sizes.h));
    const minD = Math.max(0.06, (sizes.token * 1.1) / minWH);
    dispatch({ type: 'move-tower', id, pos, minD });
    const field = fieldRef.current;
    if (field) {
      const rect = field.getBoundingClientRect();
      const srcPx = { x: pos.x * rect.width, y: pos.y * rect.height };
      let best: { id: string; d: number } | null = null;
      for (const t of state.towers) {
        if (t.id === id) continue;
        const dx = t.pos.x * rect.width - srcPx.x;
        const dy = t.pos.y * rect.height - srcPx.y;
        const d = Math.hypot(dx, dy);
        if (!best || d < best.d) best = { id: t.id, d };
      }
      const threshold = sizes.token * sizes.mergeFactor;
      if (sizes.dropHighlight && best && best.d <= threshold) {
        const srcT = state.towers.find(t => t.id === id);
        const dstT = state.towers.find(t => t.id === best!.id);
        if (srcT && dstT && canMerge(srcT, dstT)) setDropTargetId(dstT.id);
        else setDropTargetId(null);
      } else {
        setDropTargetId(null);
      }
    }
    movedDuringDragRef.current = true;
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerUp = (e: React.PointerEvent, id: string) => {
    const el = e.currentTarget as HTMLElement;
    el.releasePointerCapture?.(e.pointerId);
    if (pressTimerRef.current != null) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressingRef.current = null;

    const wasDragging = dragId === id;
    if (!wasDragging) {
      setDropTargetId(null);
      movedDuringDragRef.current = false;
      return;
    }

    setDragId(null);
    const field = fieldRef.current;
    if (!field) return;
    const rect = field.getBoundingClientRect();
    const src = state.towers.find(t => t.id === id);
    if (!src) return;
    const srcPx = { x: src.pos.x * rect.width, y: src.pos.y * rect.height };
    let best: { id: string; d: number } | null = null;
    for (const t of state.towers) {
      if (t.id === id) continue;
      const dx = t.pos.x * rect.width - srcPx.x;
      const dy = t.pos.y * rect.height - srcPx.y;
      const d = Math.hypot(dx, dy);
      if (!best || d < best.d) best = { id: t.id, d };
    }
    const threshold = sizes.token * sizes.mergeFactor;
    if (best && best.d <= threshold) {
      const dst = state.towers.find(t => t.id === best!.id);
      if (dst) {
        if (canMerge(src, dst)) {
          const { fromPx, toPx, fromNorm, toNorm } = getOriginCenters(fieldRef, lastSelectedRef.current, src.id, dst.id);
          const fromC = fromNorm || { ...src.pos };
          const toC = toNorm || { ...dst.pos };
          dispatch({ type: 'attempt-merge', sourceId: src.id, targetId: dst.id, from: fromC, to: toC, fromPx, toPx });
          dragStartRef.current = null;
          setDropTargetId(null);
          setTimeout(() => { movedDuringDragRef.current = false; }, 0);
          return;
        } else {
          const minWH = Math.max(1, Math.min(rect.width, rect.height));
          const rNorm = Math.max(0.06, (sizes.token * 1.1) / minWH);
          const dstPx = { x: dst.pos.x * rect.width, y: dst.pos.y * rect.height };
          let vx = srcPx.x - dstPx.x;
          let vy = srcPx.y - dstPx.y;
          const vlen = Math.hypot(vx, vy);
          if (vlen < 1e-6) { vx = 1; vy = 0; }
          else { vx /= vlen; vy /= vlen; }
          const newPos = {
            x: clamp(dst.pos.x + (vx * rNorm), 0, 1),
            y: clamp(dst.pos.y + (vy * rNorm), 0, 1),
          };
          dispatch({ type: 'move-tower', id, pos: newPos });
          dispatch({ type: 'resolve-all-overlaps', minD: rNorm });
          dragStartRef.current = null;
          setDropTargetId(null);
          setTimeout(() => { movedDuringDragRef.current = false; }, 0);
          return;
        }
      }
    }
    const start = dragStartRef.current;
    if (!sizes.freeMove && start && start.id === id) {
      dispatch({ type: 'move-tower', id, pos: start.pos });
    }
    if (field) {
      const minWH = Math.max(1, Math.min(rect.width, rect.height));
      const minD = Math.max(0.06, (sizes.token * 1.1) / minWH);
      dispatch({ type: 'resolve-all-overlaps', minD });
    }
    dragStartRef.current = null;
    setDropTargetId(null);
    setTimeout(() => { movedDuringDragRef.current = false; }, 0);
  };

  const handlePointerCancel = (e: React.PointerEvent, id: string) => {
    const el = e.currentTarget as HTMLElement;
    el.releasePointerCapture?.(e.pointerId);
    if (pressTimerRef.current != null) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressingRef.current = null;
    if (dragId === id) {
      setDragId(null);
    }
    setDropTargetId(null);
    e.preventDefault();
    e.stopPropagation();
  };

  return {
    dragId,
    dropTargetId,
    lastSelectedRef,
    onCellClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } as const;
}
