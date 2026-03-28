import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * useClickOutside — ejecuta handler cuando haces click fuera de cualquier elemento pasado.
 * Mantiene la semántica de "click fuera" usada en HeaderPanel para el popover VS IA.
 */
export function useClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  enabled: boolean,
  handler: (event: MouseEvent) => void
): void {
  useEffect(() => {
    if (!enabled) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const clickedInside = refs.some((r) => {
        const el = r.current;
        return !!el && !!target && el.contains(target);
      });
      if (!clickedInside) handler(e);
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [enabled, handler, ...refs]);
}

export default useClickOutside;
