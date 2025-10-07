import React from 'react';
import type { RefObject } from 'react';
import type { MergeFx, SymbolType } from '../../game/types';
import { SymbolIcon } from '../Icons';
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

        {/* Dibujo de trayectoria y puntos */}
        {start && end && (
          <g>
            {/* Recta solo si no tenemos motionPath/curva */}
            {!livePathD && !curve && (
              <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={live ? '#4dd0e1' : '#90caf9'} strokeWidth={2} markerEnd="url(#arrow)" opacity={live ? 0.9 : 0.6} />
            )}

            {/* Curva exacta (si hay motionPath) o aproximada */}
            {live && livePathD && (
              <g transform={`translate(${(start.x - half).toFixed(2)} ${(start.y - half).toFixed(2)})`}>
                <path d={livePathD.replace(/M\s*/,'M ').replace(/Q\s*/,'Q ')} fill="none" stroke="#81c784" strokeDasharray="6,6" strokeWidth={2} opacity={0.95} />
              </g>
            )}
            {!live && curve && (
              <path d={`M ${start.x} ${start.y} Q ${curve.c.x} ${curve.c.y} ${end.x} ${end.y}`} fill="none" stroke="#a5d6a7" strokeDasharray="6,6" strokeWidth={2} opacity={0.7} />
            )}

            {/* Puntos de inicio/fin */}
            <circle cx={start.x} cy={start.y} r={6} fill={live ? '#fb8c00' : '#ffcc80'} />
            <text x={start.x + 8} y={start.y - 8} fontSize={12} fill="#fff">start{live ? '' : ' (prev)'}</text>
            {/* Centro persistente en start cuando no hay vuelo activo */}
            {!live && (
              <circle cx={start.x} cy={start.y} r={5} fill="#ffa726" stroke="#ffffff" strokeWidth={1} />
            )}

            {/* Contorno de la ficha fuente (cómo la entiende el sistema) */}
            <g opacity={0.95}>
              {/* Cara del token (círculo de radio token/2) */}
              <circle cx={start.x} cy={start.y} r={half} fill="none" stroke="#fb8c00" strokeWidth={2} />
              {/* Bounding box (cuadro que encierra al token) */}
              <rect x={start.x - half} y={start.y - half} width={sizes.token} height={sizes.token} fill="none" stroke="#fb8c00" strokeWidth={1.5} strokeDasharray="4,4" />
            </g>

            {/* Ghost persistente del símbolo también en el punto de inicio */}
            {!live && lastTrace?.symbol && (
              <foreignObject
                x={start.x - half}
                y={start.y - half}
                width={sizes.token}
                height={sizes.token}
                style={{ pointerEvents: 'none', opacity: 0.45, filter: 'drop-shadow(0 0 8px rgba(244,67,54,0.55)) sepia(1) saturate(6) hue-rotate(-10deg) brightness(0.95)' }}
              >
                <div className="token-inner debug-ghost" style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <SymbolIcon type={lastTrace.symbol} />
                </div>
              </foreignObject>
            )}

            <circle cx={end.x} cy={end.y} r={6} fill={live ? '#8bc34a' : '#c5e1a5'} />
            <text x={end.x + 8} y={end.y - 8} fontSize={12} fill="#fff">end{live ? '' : ' (prev)'}</text>
            {/* Centro persistente en end cuando no hay vuelo activo */}
            {!live && (
              <circle cx={end.x} cy={end.y} r={5} fill="#a5d6a7" stroke="#ffffff" strokeWidth={1} />
            )}

            {/* Punto de control */}
            {curve && (
              <g>
                <circle cx={curve.c.x} cy={curve.c.y} r={5} fill="#ffb300" />
                <text x={curve.c.x + 8} y={curve.c.y - 8} fontSize={12} fill="#fff">ctrl</text>
              </g>
            )}

            {/* Marca persistente al final de la trayectoria previa (verde claro) */}
            {!live && (
              <g>
                <circle cx={end.x} cy={end.y} r={7} fill="#8bc34a" stroke="#ffffff" strokeWidth={1} />
                {/* Circunferencia persistente en el punto final para ver el cuerpo al desaparecer */}
                <circle cx={end.x} cy={end.y} r={half} fill="none" stroke="#8bc34a" strokeWidth={2} strokeDasharray="6,4" opacity={0.95} />
                <rect x={end.x - half} y={end.y - half} width={sizes.token} height={sizes.token} fill="none" stroke="#8bc34a" strokeWidth={1.5} strokeDasharray="4,4" opacity={0.85} />
              </g>
            )}

            {/* Ghost persistente con el símbolo de la ficha fuente en el punto final */}
            {!live && lastTrace?.symbol && (
              <foreignObject
                x={end.x - half}
                y={end.y - half}
                width={sizes.token}
                height={sizes.token}
                style={{ pointerEvents: 'none', opacity: 0.6, filter: 'drop-shadow(0 0 10px rgba(244,67,54,0.6)) sepia(1) saturate(6) hue-rotate(-10deg) brightness(0.95)' }}
              >
                <div className="token-inner debug-ghost" style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <SymbolIcon type={lastTrace.symbol} />
                </div>
              </foreignObject>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

export default DebugOverlay;
