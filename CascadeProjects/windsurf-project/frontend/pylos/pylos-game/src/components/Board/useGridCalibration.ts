import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

/**
 * useGridCalibration
 * - Permite arrastrar (mover) y redimensionar el grid de huecos
 *   cambiando los gaps horizontal y vertical (no se escala el diámetro del hueco).
 * - Emite onMove(x, y) y onResize(gapX, gapY).
 */
export function useGridCalibration(
  enabled: boolean,
  gridX: number | undefined,
  gridY: number | undefined,
  gapX: number | undefined,
  gapY: number | undefined,
  onMove?: (x: number, y: number) => void,
  onResize?: (gapX: number, gapY: number) => void,
) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<null | (
    | { kind: 'move'; startX: number; startY: number; startGX: number; startGY: number }
    | { kind: 'resize'; startX: number; startY: number; startGapX: number; startGapY: number; corner: 'tl'|'tr'|'bl'|'br' }
  )>(null);

  const onOverlayDown = (e: React.MouseEvent) => {
    if (!enabled) return;
    // Evitar que el arrastre del tablero interfiera
    e.preventDefault();
    e.stopPropagation();
    setDrag({ kind: 'move', startX: e.clientX, startY: e.clientY, startGX: gridX ?? 0, startGY: gridY ?? 0 });
  };

  const onHandleDown = (e: React.MouseEvent, corner: 'tl'|'tr'|'bl'|'br') => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    setDrag({ kind: 'resize', startX: e.clientX, startY: e.clientY, startGapX: gapX ?? 6, startGapY: gapY ?? 6, corner });
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!drag) return;
    if (drag.kind === 'move') {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const nextX = Math.round(drag.startGX + dx);
      const nextY = Math.round(drag.startGY + dy);
      onMove?.(nextX, nextY);
    } else {
      // resize: ajustar gaps derivados del delta y del lado agarrado
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const signX = drag.corner.includes('l') ? -1 : 1; // mover izquierda invierte el sentido
      const signY = drag.corner.includes('t') ? -1 : 1;
      const nextGapX = Math.round(
        Math.max(-24, Math.min(24, drag.startGapX + (dx * signX) / 3))
      );
      const nextGapY = Math.round(
        Math.max(-24, Math.min(24, drag.startGapY + (dy * signY) / 3))
      );
      onResize?.(nextGapX, nextGapY);
    }
  }, [drag, onMove]);

  const onMouseUp = useCallback(() => {
    if (drag) setDrag(null);
  }, [drag]);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [drag, onMouseMove, onMouseUp]);

  return { overlayRef, onOverlayDown, onHandleDown } as const;
}
