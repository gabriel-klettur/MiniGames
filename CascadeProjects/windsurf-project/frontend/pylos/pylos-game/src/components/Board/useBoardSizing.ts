import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

/**
 * Hook que encapsula la lógica de redimensionamiento del tablero en modo configuración.
 * Gestiona los manejadores de esquina (drag) y emite onResize(cell, gap).
 */
export function useBoardSizing(
  configMode: boolean,
  cellSize: number | undefined,
  gapSize: number | undefined,
  onResize?: (nextCell: number, nextGap: number) => void,
) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<null | {
    corner: 'tl'|'tr'|'bl'|'br';
    startX: number;
    startY: number;
    startW: number;
    startCell: number;
    startGap: number;
    minRatio: number;
    maxRatio: number;
  }>(null);

  const onHandleDown = (e: React.MouseEvent, corner: 'tl'|'tr'|'bl'|'br') => {
    if (!configMode) return;
    e.preventDefault();
    e.stopPropagation();
    const el = boardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startW = rect.width;
    const startCell = cellSize ?? 48;
    const startGap = gapSize ?? 6;
    // Calcular límites de escala a partir de límites duros de cell/gap
    const minRatio = Math.max(36 / startCell, 4 / startGap);
    const maxRatio = Math.min(96 / startCell, 16 / startGap);
    setDragging({ corner, startX: e.clientX, startY: e.clientY, startW, startCell, startGap, minRatio, maxRatio });
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const signX = dragging.corner.includes('r') ? 1 : -1;
    const signY = dragging.corner.includes('b') ? 1 : -1;
    const delta = ((e.clientX - dragging.startX) * signX + (e.clientY - dragging.startY) * signY) / 2;
    const newW = Math.max(50, dragging.startW + delta);
    let ratio = newW / dragging.startW;
    ratio = Math.max(dragging.minRatio, Math.min(dragging.maxRatio, ratio));
    const nextCell = Math.round(dragging.startCell * ratio);
    const nextGap = Math.round(dragging.startGap * ratio);
    onResize?.(nextCell, nextGap);
  }, [dragging, onResize]);

  const onMouseUp = useCallback(() => {
    if (dragging) setDragging(null);
  }, [dragging]);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp]);

  return { boardRef, onHandleDown } as const;
}
