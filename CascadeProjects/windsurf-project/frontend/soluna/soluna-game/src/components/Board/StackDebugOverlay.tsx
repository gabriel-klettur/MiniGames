import React, { useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import type { BoardSizes } from './hooks/useBoardSizes';
import type { MergeFx } from '../../game/types';

export interface StackDebugOverlayProps {
  sizes: BoardSizes;
  mergeFx: MergeFx | null;
  /** Optional snapshot to keep overlays after merge clears. */
  lastMergeFx?: MergeFx | null;
  fieldRef: RefObject<HTMLDivElement | null>;
  tokenSize?: number;
}

/**
 * StackDebugOverlay — overlays para comprender apilado (NO trayectorias).
 * Dibuja 10 ayudas:
 *   1) Eje de apilado y dirección (doble flecha con ticks por nivel)
 *   2) Guías por nivel (grid horizontal)
 *   3) (eliminado)
 *   4) (eliminado)
 *   5) (eliminado)
 *   6) Centro/alineación y offset destino (cruz + vector si aplica)
 *   7) (eliminado)
 *   8) (eliminado)
 *   9) (eliminado)
 *  10) (eliminado)
 */
const StackDebugOverlay: React.FC<StackDebugOverlayProps> = ({ sizes, mergeFx, lastMergeFx, fieldRef, tokenSize }) => {
  // Estado y banderas básicas
  const ctx = mergeFx ?? lastMergeFx ?? null;
  const active = !!sizes.w && !!sizes.h && !!ctx;

  const step = Math.max(2, sizes.stackStep);

  // Coordenadas destino (centro) y origen; usar valores neutros si no hay ctx
  const dst = useMemo(() => {
    if (!ctx) return { x: 0, y: 0 };
    const x = (ctx.toPx?.x != null) ? ctx.toPx.x : ctx.to.x * sizes.w;
    const y = (ctx.toPx?.y != null) ? ctx.toPx.y : ctx.to.y * sizes.h;
    return { x, y };
  }, [ctx, sizes.w, sizes.h]);

  // Cantidad de niveles a visualizar: anclar a maxDiscs para una escala estable
  const tickCount = Math.max(1, sizes.maxDiscs);

  // Leer offsetY destino y duración de vuelo desde CSS (si existen)
  const [destOffsetY, setDestOffsetY] = useState<number>(0);
  useEffect(() => {
    const field = fieldRef.current;
    const ellipse = field?.parentElement as HTMLElement | null; // play-ellipse
    try {
      if (ellipse) {
        const cs = getComputedStyle(ellipse);
        const raw = cs.getPropertyValue('--flight-dest-offset-y').trim();
        const n = parseFloat(raw.endsWith('px') ? raw : raw || '0');
        setDestOffsetY(Number.isFinite(n) ? n : 0);
      } else {
        setDestOffsetY(0);
      }
    } catch { setDestOffsetY(0); }
  }, [fieldRef]);

  // Dimensiones auxiliares
  const tokenW = (tokenSize ?? sizes.token);
  const half = tokenW / 2;

  // Si no está activo, no renderizar (hooks ya definidos arriba)
  if (!active) return null;

  // Helpers SVG
  const axisColor = '#ffeb3b';
  const guideColor = 'rgba(255,255,255,0.35)';

  return (
    <div
      className="stack-debug-overlay"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1000002 }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${sizes.w} ${sizes.h}`} preserveAspectRatio="none">
        {/* 1) Eje de apilado (flecha hacia arriba) y ticks */}
        <g>
          <line x1={dst.x} y1={dst.y - step * (tickCount + 2)} x2={dst.x} y2={dst.y} stroke={axisColor} strokeWidth={2} strokeDasharray="6,6" />
          {/* punta flecha */}
          <polygon points={`${dst.x},${dst.y - step * (tickCount + 2)} ${dst.x - 6},${dst.y - step * (tickCount + 2) + 12} ${dst.x + 6},${dst.y - step * (tickCount + 2) + 12}`} fill={axisColor} />
          {Array.from({ length: tickCount }).map((_, i) => (
            <line key={`tick-${i}`} x1={dst.x - half - 6} x2={dst.x + half + 6} y1={dst.y - i * step} y2={dst.y - i * step} stroke={guideColor} strokeWidth={1} opacity={0.6} />
          ))}
        </g>

        {/* 2) Guías horizontales con numeración de nivel (ancladas a destino) */}
        <g>
          {Array.from({ length: tickCount }).map((_, i) => (
            <g key={`lvl-${i}`}>
              <line x1={dst.x - half - 20} x2={dst.x + half + 20} y1={dst.y - i * step} y2={dst.y - i * step} stroke={guideColor} strokeWidth={0.75} strokeDasharray="3,6" />
              <text x={dst.x + half + 24} y={dst.y - i * step + 4} fill="#fff" fontSize={10} opacity={0.85}>{`nivel ${i + 1}`}</text>
            </g>
          ))}
        </g>

        {/* 6) Centro/alineación + vector de offset destino */}
        <g>
          {/* cruz central */}
          <line x1={dst.x - 8} y1={dst.y} x2={dst.x + 8} y2={dst.y} stroke="#fff" strokeWidth={1.5} />
          <line x1={dst.x} y1={dst.y - 8} x2={dst.x} y2={dst.y + 8} stroke="#fff" strokeWidth={1.5} />
          {/* vector offset Y si existe */}
          {destOffsetY !== 0 && (
            <g>
              <line x1={dst.x + half + 28} y1={dst.y} x2={dst.x + half + 28} y2={dst.y + destOffsetY} stroke="#80cbc4" strokeWidth={2} />
              <polygon points={`${dst.x + half + 28},${dst.y + destOffsetY} ${dst.x + half + 22},${dst.y + destOffsetY - 10} ${dst.x + half + 34},${dst.y + destOffsetY - 10}`} fill="#80cbc4" />
              <text x={dst.x + half + 34} y={dst.y + destOffsetY} fill="#b2dfdb" fontSize={10}>{`offsetY ${destOffsetY.toFixed(0)}px`}</text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

export default StackDebugOverlay;
