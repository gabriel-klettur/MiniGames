import React from 'react';
import type { RefObject } from 'react';
import type { MergeFx } from '../../game/types';
import type { BoardSizes } from './hooks/useBoardSizes';

export interface DebugOverlayProps {
  sizes: BoardSizes;
  flightPx: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  mergeFx: MergeFx | null;
  fieldRef: RefObject<HTMLDivElement | null>;
}

/**
 * DebugOverlay — Dibuja ayudas visuales para entender el origen/destino
 * y trayectoria de las animaciones de vuelo y puntos de fusión/apilado.
 * No intercepta eventos (pointer-events: none).
 */
const DebugOverlay: React.FC<DebugOverlayProps> = ({ sizes, flightPx, mergeFx }) => {
  if (!sizes.w || !sizes.h) return null;

  // Recalcula una curva cuadrática aproximada como la usada en useMergeFlight
  function computeCurve(start: { x: number; y: number }, end: { x: number; y: number }) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.hypot(dx, dy);
    if (!isFinite(dist) || dist < 1) return null;
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;
    // Vector normal (perpendicular) para el control
    let nx = -dy;
    let ny = dx;
    if (ny > 0) { nx = -nx; ny = -ny; }
    const nlen = Math.hypot(nx, ny) || 1;
    const bend = Math.min(180, Math.max(40, dist * sizes.curveBend));
    const cx = mx + (nx / nlen) * bend;
    const cy = my + (ny / nlen) * bend;
    return { c: { x: cx, y: cy } };
  }

  const start = flightPx?.start || null;
  const end = flightPx?.end || null;
  const curve = (start && end && sizes.curveEnabled) ? computeCurve(start, end) : null;

  const stackCount = mergeFx?.sourceStack?.length ?? null;

  const panelBg = 'rgba(0,0,0,0.5)';
  const panelBorder = 'rgba(255,255,255,0.2)';

  return (
    <div
      className="debug-overlay"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1000002 }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${sizes.w} ${sizes.h}`} preserveAspectRatio="none">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4dd0e1" />
          </marker>
        </defs>

        {/* Panel de parámetros actuales */}
        <g>
          <foreignObject x={8} y={8} width={260} height={110}>
            <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Debug animación</div>
              <div>stackStep: {sizes.stackStep}px</div>
              <div>curve: {String(sizes.curveEnabled)} bend: {sizes.curveBend.toFixed(2)}</div>
              <div>linger: {sizes.lingerMs}ms</div>
              {stackCount != null && <div>stack count (origen): {stackCount}</div>}
            </div>
          </foreignObject>
        </g>

        {/* Dibujo de trayectoria y puntos */}
        {start && end && (
          <g>
            {/* Recta con flecha */}
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#4dd0e1" strokeWidth={2} markerEnd="url(#arrow)" opacity={0.7} />

            {/* Curva aproximada */}
            {curve && (
              <path d={`M ${start.x} ${start.y} Q ${curve.c.x} ${curve.c.y} ${end.x} ${end.y}`} fill="none" stroke="#81c784" strokeDasharray="6,6" strokeWidth={2} opacity={0.9} />
            )}

            {/* Puntos de inicio/fin */}
            <circle cx={start.x} cy={start.y} r={6} fill="#e53935" />
            <text x={start.x + 8} y={start.y - 8} fontSize={12} fill="#fff">start</text>

            <circle cx={end.x} cy={end.y} r={6} fill="#43a047" />
            <text x={end.x + 8} y={end.y - 8} fontSize={12} fill="#fff">end</text>

            {/* Punto de control */}
            {curve && (
              <g>
                <circle cx={curve.c.x} cy={curve.c.y} r={5} fill="#ffb300" />
                <text x={curve.c.x + 8} y={curve.c.y - 8} fontSize={12} fill="#fff">ctrl</text>
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

export default DebugOverlay;
