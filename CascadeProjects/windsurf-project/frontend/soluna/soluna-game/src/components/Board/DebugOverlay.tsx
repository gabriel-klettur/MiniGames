import React from 'react';
import type { RefObject } from 'react';
import type { MergeFx, SymbolType } from '../../game/types';
import type { BoardSizes } from './hooks/useBoardSizes';

export interface DebugOverlayProps {
  sizes: BoardSizes;
  flightPx: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  /** Optional persisted last trace when no active flight. */
  lastTrace?: { start: { x: number; y: number }; end: { x: number; y: number }; stackCount?: number; symbol?: SymbolType } | null;
  mergeFx: MergeFx | null;
  fieldRef: RefObject<HTMLDivElement | null>;
  motionPath?: string;
}

/**
 * DebugOverlay — Dibuja ayudas visuales para entender el origen/destino
 * y trayectoria de las animaciones de vuelo y puntos de fusión/apilado.
 * No intercepta eventos (pointer-events: none).
 */
const DebugOverlay: React.FC<DebugOverlayProps> = ({ sizes, flightPx, lastTrace, mergeFx, motionPath }) => {
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

  // Prefer live flight; fallback to last persisted trace
  const live = !!flightPx;
  const start = (flightPx?.start || lastTrace?.start) || null;
  const end = (flightPx?.end || lastTrace?.end) || null;
  const curve = (start && end && sizes.curveEnabled) ? computeCurve(start, end) : null;

  // Extract raw SVG path data from CSS path("...") if provided
  function extractSvgD(cssPath?: string): string | null {
    if (!cssPath) return null;
    const s = String(cssPath);
    const firstQuote = s.indexOf('"');
    const lastQuote = s.lastIndexOf('"');
    if (firstQuote >= 0 && lastQuote > firstQuote) return s.slice(firstQuote + 1, lastQuote);
    const firstSingle = s.indexOf("'");
    const lastSingle = s.lastIndexOf("'");
    if (firstSingle >= 0 && lastSingle > firstSingle) return s.slice(firstSingle + 1, lastSingle);
    const paren = s.indexOf('(');
    const parenEnd = s.lastIndexOf(')');
    if (paren >= 0 && parenEnd > paren) return s.slice(paren + 1, parenEnd);
    return null;
  }
  const livePathD = live ? extractSvgD(motionPath) : null;

  const stackCount = (live ? (mergeFx?.sourceStack?.length ?? null) : (lastTrace?.stackCount ?? null));
  const half = Math.max(0, sizes.token / 2);

  const panelBg = 'rgba(0,0,0,0.5)';
  const panelBorder = 'rgba(255,255,255,0.2)';

  return (
    <div
      className="debug-overlay"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1000002 }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" viewBox={`0 0 ${sizes.w} ${sizes.h}`} preserveAspectRatio="none">

        {/* Panel de parámetros actuales */}
        <g>
          <foreignObject x={8} y={8} width={260} height={110}>
            <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Debug animación</div>
              <div>stackStep: {sizes.stackStep}px</div>
              <div>curve: {String(sizes.curveEnabled)} bend: {sizes.curveBend.toFixed(2)}</div>
              <div>linger: {sizes.lingerMs}ms</div>
              {stackCount != null && <div>stack count (origen): {stackCount}</div>}
              <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, background: '#fb8c00', borderRadius: '50%' }} />
                  Origen
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, background: '#8bc34a', borderRadius: '50%' }} />
                  Fin
                </span>
              </div>
            </div>
          </foreignObject>
        </g>

        {/* Dibujo de trayectoria (solo curva) */}
        {start && end && (
          <g>
            {/* Curva exacta (si hay motionPath) o aproximada */}
            {live && livePathD && (
              <g transform={`translate(${(start.x - half).toFixed(2)} ${(start.y - half).toFixed(2)})`}>
                <path d={livePathD.replace(/M\s*/,'M ').replace(/Q\s*/,'Q ')} fill="none" stroke="#81c784" strokeDasharray="6,6" strokeWidth={2} opacity={0.95} />
              </g>
            )}
            {!live && curve && (
              <path d={`M ${start.x} ${start.y} Q ${curve.c.x} ${curve.c.y} ${end.x} ${end.y}`} fill="none" stroke="#a5d6a7" strokeDasharray="6,6" strokeWidth={2} opacity={0.7} />
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

export default DebugOverlay;
