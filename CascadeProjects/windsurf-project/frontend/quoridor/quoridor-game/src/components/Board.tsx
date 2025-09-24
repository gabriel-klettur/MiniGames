import React from 'react';
import { validateWallPlacement } from '../game/rules.ts';

export interface BoardProps {
  size?: number; // default 9
  className?: string;
  onCellClick?: (row: number, col: number) => void;
  pawns?: { L: [number, number]; D: [number, number] };
  /**
   * wallGap — Espacio (en px) entre celdas para reservar zona de vallas.
   * Nota: por ahora es puramente visual; la interacción de vallas se añadirá después.
   */
  wallGap?: number;
  /**
   * walls — Lista de vallas colocadas para su renderizado.
   * Mantiene el mismo esquema que el motor: r,c en 0..size-2.
   * Campo opcional 'by' indica el jugador que la colocó para colorear.
   */
  walls?: Array<{ o: 'H' | 'V'; r: number; c: number; by?: 'L' | 'D' }>;
  /** Evento al intentar colocar una valla en un slot. */
  onWallClick?: (o: 'H' | 'V', r: number, c: number) => void;
  /** Celdas a resaltar (sombras) para indicar movimientos legales del jugador en turno. */
  highlightCells?: Array<[number, number]>;
  /** Modo de interacción: mover o colocar valla (para móvil/tablet). */
  inputMode?: 'move' | 'wall';
  /** Alternar modo de interacción (se invoca en long-press). */
  onToggleInputMode?: () => void;
  /** Si el puntero es "coarse" (móvil/tablet) para ajustar UX. */
  isCoarsePointer?: boolean;
  /** Deformación del tablero: define 4 vértices (en %) para un clip-path poligonal. */
  warp?: {
    enabled: boolean;
    tl: { x: number; y: number };
    tr: { x: number; y: number };
    br: { x: number; y: number };
    bl: { x: number; y: number };
  };
  /** Mostrar los hitboxes visuales de vallas (sigue permitiendo clic incluso ocultos). */
  showWallHitboxes?: boolean;
  /** Color base para el hitbox visual de vallas. */
  wallHitboxColor?: 'purple' | 'cyan' | 'amber' | 'blue' | 'emerald' | 'gray';
  /** Si true, el preview de valla usa un solo color (sin verde/rojo por validez). */
  wallPreviewMonochrome?: boolean;
  /** Opacidad del hitbox visible. */
  wallHitboxOpacity?: 10 | 20 | 30 | 40;
  /** Permitir preview por hover aunque los hitboxes estén ocultos. */
  previewOnHoverWhenHidden?: boolean;
  /** Forma del hitbox visual por orientación (porcentajes 10..100). */
  wallHitboxShape?: {
    H: { widthPct: number; heightPct: number };
    V: { widthPct: number; heightPct: number };
  };
  /** Grosor extra del hitbox en píxeles por orientación. */
  wallHitboxThicknessPx?: { H: number; V: number };
  /** Expandir área clickeable con el tamaño (beta). */
  expandClickableWithShape?: boolean;
  /** Restringir clic/hover exactamente al shape del hitbox. */
  restrictClickToHitbox?: boolean;
}

/**
 * Board — Tablero presentacional de Quoridor (placeholder). Muestra una cuadrícula y peones.
 */
export default function Board({
  size = 9,
  className,
  onCellClick = () => {},
  pawns = { L: [8, Math.floor(9 / 2)], D: [0, Math.floor(9 / 2)] },
  wallGap = 8,
  walls = [],
  onWallClick = () => {},
  highlightCells = [],
  inputMode = 'move',
  onToggleInputMode = () => {},
  isCoarsePointer = false,
  warp,
  showWallHitboxes = true,
  wallHitboxColor = 'purple',
  wallPreviewMonochrome = false,
  wallHitboxOpacity = 20,
  previewOnHoverWhenHidden = false,
  wallHitboxShape = { H: { widthPct: 100, heightPct: 100 }, V: { widthPct: 100, heightPct: 100 } },
  wallHitboxThicknessPx = { H: 0, V: 0 },
  expandClickableWithShape = false,
  restrictClickToHitbox = false,
}: BoardProps) {
  // Construimos una rejilla de (2*size - 1) con pistas alternas: celda (1fr), valla (wallGap px)
  const gridCount = size * 2 - 1;
  const track = Array.from({ length: gridCount }, (_, i) => (i % 2 === 0 ? '1fr' : `${wallGap}px`)).join(' ');
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: track,
    gridTemplateRows: track,
  };

  // Clip-path opcional si warp.enabled está activo (aplicado al wrapper)
  const clipPath = React.useMemo(() => {
    if (!warp || !warp.enabled) return undefined;
    const { tl, tr, br, bl } = warp;
    const p = (pt: { x: number; y: number }) => `${pt.x}% ${pt.y}%`;
    return `polygon(${p(tl)}, ${p(tr)}, ${p(br)}, ${p(bl)})`;
  }, [warp]);

  // --- Transformación proyectiva (homografía) para deformar TODA la rejilla ---
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [matrix3d, setMatrix3d] = React.useState<string | undefined>(undefined);

  // Paletas predefinidas para evitar clases dinámicas no rastreadas por Tailwind
  const themeVariants = {
    purple: {
      10: { base: 'bg-purple-500/10', hover: 'hover:bg-purple-500/20' },
      20: { base: 'bg-purple-500/20', hover: 'hover:bg-purple-500/30' },
      30: { base: 'bg-purple-500/30', hover: 'hover:bg-purple-500/40' },
      40: { base: 'bg-purple-500/40', hover: 'hover:bg-purple-500/50' },
      ring: 'ring-purple-500/60', previewBg: 'bg-purple-400/10',
    },
    cyan: {
      10: { base: 'bg-cyan-500/10', hover: 'hover:bg-cyan-500/20' },
      20: { base: 'bg-cyan-500/20', hover: 'hover:bg-cyan-500/30' },
      30: { base: 'bg-cyan-500/30', hover: 'hover:bg-cyan-500/40' },
      40: { base: 'bg-cyan-500/40', hover: 'hover:bg-cyan-500/50' },
      ring: 'ring-cyan-500/60', previewBg: 'bg-cyan-400/10',
    },
    blue: {
      10: { base: 'bg-blue-500/10', hover: 'hover:bg-blue-500/20' },
      20: { base: 'bg-blue-500/20', hover: 'hover:bg-blue-500/30' },
      30: { base: 'bg-blue-500/30', hover: 'hover:bg-blue-500/40' },
      40: { base: 'bg-blue-500/40', hover: 'hover:bg-blue-500/50' },
      ring: 'ring-blue-500/60', previewBg: 'bg-blue-400/10',
    },
    emerald: {
      10: { base: 'bg-emerald-500/10', hover: 'hover:bg-emerald-500/20' },
      20: { base: 'bg-emerald-500/20', hover: 'hover:bg-emerald-500/30' },
      30: { base: 'bg-emerald-500/30', hover: 'hover:bg-emerald-500/40' },
      40: { base: 'bg-emerald-500/40', hover: 'hover:bg-emerald-500/50' },
      ring: 'ring-emerald-500/60', previewBg: 'bg-emerald-400/10',
    },
    amber: {
      10: { base: 'bg-amber-500/10', hover: 'hover:bg-amber-500/20' },
      20: { base: 'bg-amber-500/20', hover: 'hover:bg-amber-500/30' },
      30: { base: 'bg-amber-500/30', hover: 'hover:bg-amber-500/40' },
      40: { base: 'bg-amber-500/40', hover: 'hover:bg-amber-500/50' },
      ring: 'ring-amber-500/60', previewBg: 'bg-amber-400/10',
    },
    gray: {
      10: { base: 'bg-gray-500/10', hover: 'hover:bg-gray-500/20' },
      20: { base: 'bg-gray-500/20', hover: 'hover:bg-gray-500/30' },
      30: { base: 'bg-gray-500/30', hover: 'hover:bg-gray-500/40' },
      40: { base: 'bg-gray-500/40', hover: 'hover:bg-gray-500/50' },
      ring: 'ring-gray-500/60', previewBg: 'bg-gray-400/10',
    },
  } as const;
  const t = themeVariants[wallHitboxColor] ?? themeVariants.purple;
  const variant = t[wallHitboxOpacity] ?? t[20];
  const baseHitboxClass = showWallHitboxes ? `${variant.base} ${variant.hover}` : 'bg-transparent hover:bg-transparent';

  type Pt = { x: number; y: number };

  // Pequeño solver Gauss para 8x8 (n=8)
  function solve(A: number[][], b: number[]): number[] {
    const n = b.length;
    // Augmented matrix
    for (let i = 0; i < n; i++) A[i] = [...A[i], b[i]];
    for (let i = 0; i < n; i++) {
      // Pivot
      let maxR = i;
      for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[maxR][i])) maxR = r;
      const tmp = A[i]; A[i] = A[maxR]; A[maxR] = tmp;
      const pivot = A[i][i] || 1e-12;
      // Normalize row
      for (let c = i; c <= n; c++) A[i][c] /= pivot;
      // Eliminate others
      for (let r = 0; r < n; r++) if (r !== i) {
        const f = A[r][i];
        for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c];
      }
    }
    return A.map((row) => row[n]);
  }

  // Calcula homografía 2D que mapea src rect (0,0)-(w,0)-(w,h)-(0,h) a quad dst
  function homographyToMatrix3d(w: number, h: number, dst: [Pt, Pt, Pt, Pt]): string {
    const src: [Pt, Pt, Pt, Pt] = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ];
    // Solve for 8 unknowns of H (h11..h32), with h33=1
    const A: number[][] = [];
    const bb: number[] = [];
    for (let i = 0; i < 4; i++) {
      const X = src[i].x, Y = src[i].y;
      const x = dst[i].x, y = dst[i].y;
      A.push([X, Y, 1, 0, 0, 0, -x * X, -x * Y]); bb.push(x);
      A.push([0, 0, 0, X, Y, 1, -y * X, -y * Y]); bb.push(y);
    }
    const sol = solve(A, bb);
    const [h11, h12, h13, h21, h22, h23, h31, h32] = sol;
    const h33 = 1;
    // Embed en 4x4 matrix3d con transform-origin 0 0
    //   [ h11 h12 0 h13 ]
    //   [ h21 h22 0 h23 ]
    //   [  0   0  1  0  ]
    //   [ h31 h32 0 h33 ]
    const m = [
      h11, h21, 0, h31,
      h12, h22, 0, h32,
      0,   0,   1, 0,
      h13, h23, 0, h33,
    ];
    return `matrix3d(${m.map((v) => (Math.abs(v) < 1e-10 ? 0 : v)).join(',')})`;
  }

  // Observa tamaño y recalcula matriz cuando cambia warp o tamaño
  React.useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const compute = () => {
      if (!warp || !warp.enabled) { setMatrix3d(undefined); return; }
      const rect = el.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      const toPx = (pt: Pt) => ({ x: (pt.x / 100) * w, y: (pt.y / 100) * h });
      const { tl, tr, br, bl } = warp;
      const mat = homographyToMatrix3d(w, h, [toPx(tl), toPx(tr), toPx(br), toPx(bl)]);
      setMatrix3d(mat);
    };
    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    return () => ro.disconnect();
  }, [warp]);

  const pawnType = (r: number, c: number) =>
    pawns.L[0] === r && pawns.L[1] === c ? 'L' : pawns.D[0] === r && pawns.D[1] === c ? 'D' : null;

  const getWall = (o: 'H' | 'V', r: number, c: number) => walls.find((w) => w.o === o && w.r === r && w.c === c);
  const hlSet = new Set(highlightCells.map(([r, c]) => `${r},${c}`));

  // Estado local para previsualización (hover) de valla de 2 segmentos
  const [hover, setHover] = React.useState<null | { o: 'H' | 'V'; r: number; c: number }>(null);
  // Estado de pulsación para mostrar preview aunque los hitboxes estén ocultos
  const [pressingWall, setPressingWall] = React.useState<null | { o: 'H' | 'V'; r: number; c: number }>(null);

  // Long-press para alternar modo en móvil/tablet
  const longPressTimer = React.useRef<number | null>(null);
  const longPressFired = React.useRef(false);
  const LONG_PRESS_MS = 450;

  const clearLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onPointerDownRoot = () => {
    longPressFired.current = false;
    if (!isCoarsePointer) return; // solo móvil/tablet
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      onToggleInputMode();
    }, LONG_PRESS_MS);
  };

  const onPointerUpRoot = () => {
    clearLongPress();
    // Si se disparó long-press, evitamos que el siguiente click "pase" a hijos
    // Devolvemos el control a los handlers de botones (no hacemos preventDefault aquí).
  };

  return (
    <div
      ref={rootRef}
      className={["w-full", "aspect-square", "select-none", className ?? ""].join(" ").trim()}
      style={clipPath ? { clipPath } : undefined}
    >
      <div
        className="relative w-full h-full"
        style={{ transformOrigin: '0 0', transform: matrix3d }}
      >
        <div
          className="relative grid w-full h-full bg-gray-800/60 p-1 rounded-md"
          style={gridStyle}
          onPointerDown={onPointerDownRoot}
          onPointerUp={onPointerUpRoot}
          onPointerCancel={clearLongPress}
          onPointerLeave={clearLongPress}
        >
          {Array.from({ length: gridCount }).map((_, gr) => (
            <React.Fragment key={gr}>
              {Array.from({ length: gridCount }).map((__, gc) => {
                const evenR = gr % 2 === 0;
                const evenC = gc % 2 === 0;
                const baseStyle: React.CSSProperties = {
                  gridRow: `${gr + 1} / ${gr + 2}`,
                  gridColumn: `${gc + 1} / ${gc + 2}`,
                };
                if (evenR && evenC) {
                  // Celda de juego
                  const r = gr / 2;
                  const c = gc / 2;
                  const type = pawnType(r, c);
                  const highlighted = hlSet.has(`${r},${c}`);
                  return (
                    <button
                      key={`${gr}-${gc}`}
                      style={baseStyle}
                      className={[
                        'relative bg-gray-900/60 focus:outline-none',
                        highlighted && (!isCoarsePointer || inputMode === 'move')
                          ? 'hover:bg-gray-800 active:bg-gray-700 focus:ring-1 focus:ring-emerald-500 cursor-pointer'
                          : 'cursor-default',
                      ].join(' ')}
                      onClick={() => {
                        // Solo permitir clic si la celda está resaltada (movimiento legal)
                        if ((!isCoarsePointer || inputMode === 'move') && highlighted) onCellClick(r, c);
                      }}
                      title={`(${r}, ${c})`}
                    >
                      {highlighted && (
                        <span
                          aria-hidden
                          className="absolute inset-0 rounded-md ring-2 ring-emerald-500/40 bg-emerald-400/5"
                        />
                      )}
                      {type && (
                        <span
                          className={[
                            'absolute inset-1 rounded-full grid place-items-center text-[10px] font-medium',
                            type === 'L' ? 'bg-orange-500/90 text-white' : 'bg-amber-900/90 text-white',
                          ].join(' ')}
                        >
                          {type}
                        </span>
                      )}
                    </button>
                  );
                }
                if (!evenR && evenC) {
                  // Slot horizontal (entre filas r y r+1) en columna c,c+1
                  const r = (gr - 1) / 2;
                  const c = gc / 2;
                  const valid = c < size - 1; // índices válidos 0..size-2
                  // Una valla H colocada en (r,c) cubre dos segmentos: (c) y (c+1)
                  const wobjH_here = getWall('H', r, c);
                  const wobjH_left = c > 0 ? getWall('H', r, c - 1) : undefined;
                  const coverH = wobjH_here ?? wobjH_left;
                  const active = !!coverH;
                  const isLeaderH = !!wobjH_here;
                  if (!valid) {
                    // Borde derecho: hacer clic aquí debe actuar como si clicaras en la
                    // penúltima columna (c = size-2). También propagamos hover para el preview.
                    const proxyC = Math.max(0, size - 2);
                    // Visual: en borde proxy no hay hover activo; clamp para no inundar visualmente
                    const innerStyle: React.CSSProperties = {
                      width: `${Math.min(100, wallHitboxShape.H.widthPct)}%`,
                      height: `${Math.min(100, wallHitboxShape.H.heightPct)}%`,
                    };
                    const innerClass = baseHitboxClass;
                    return (
                      <button
                        key={`${gr}-${gc}`}
                        style={baseStyle}
                        className={[
                          'w-full h-full rounded-[2px] grid place-items-center',
                        ].join(' ')}
                        title={`Valla H @ (${r},${proxyC})`}
                        onClick={restrictClickToHitbox ? undefined : (() => { onWallClick('H', r, proxyC); })}
                        onMouseEnter={() => setHover({ o: 'H', r, c: proxyC })}
                        onPointerEnter={() => setHover({ o: 'H', r, c: proxyC })}
                        onMouseLeave={() => { setHover(null); setPressingWall(null); }}
                        onPointerLeave={() => { setHover(null); setPressingWall(null); }}
                        onPointerDown={() => { setPressingWall({ o: 'H', r, c: proxyC }); setHover({ o: 'H', r, c: proxyC }); }}
                        onPointerUp={() => { setPressingWall(null); setHover(null); }}
                        onPointerCancel={() => { setPressingWall(null); setHover(null); }}
                        aria-label={`Edge proxy H (${r},${proxyC})`}
                      >
                        <span
                          className={[ 'block rounded-[2px]', innerClass ].join(' ')}
                          style={innerStyle}
                          onClick={restrictClickToHitbox ? (() => { onWallClick('H', r, proxyC); }) : undefined}
                          onMouseEnter={() => setHover({ o: 'H', r, c: proxyC })}
                          onPointerEnter={() => setHover({ o: 'H', r, c: proxyC })}
                          onMouseLeave={() => { setHover(null); setPressingWall(null); }}
                          onPointerLeave={() => { setHover(null); setPressingWall(null); }}
                          onPointerDown={() => { setPressingWall({ o: 'H', r, c: proxyC }); setHover({ o: 'H', r, c: proxyC }); }}
                          onPointerUp={() => { setPressingWall(null); setHover(null); }}
                          onPointerCancel={() => { setPressingWall(null); setHover(null); }}
                        />
                      </button>
                    );
                  }
                  const isHover = hover && hover.o === 'H' && hover.r === r && hover.c === c && !active;
                  const hoverEnabled = (((showWallHitboxes || previewOnHoverWhenHidden) && !!isHover))
                    || (!!pressingWall && pressingWall.o === 'H' && pressingWall.r === r && pressingWall.c === c && !active);
                  const invalidPlacement = hoverEnabled && !validateWallPlacement(
                    {
                      size,
                      pawns: {
                        L: { row: pawns.L[0], col: pawns.L[1] },
                        D: { row: pawns.D[0], col: pawns.D[1] },
                      },
                      walls,
                      wallsLeft: { L: 10, D: 10 },
                      current: 'L',
                    },
                    { o: 'H', r, c },
                  );
                  const hoverClass = invalidPlacement
                    ? 'bg-red-500/15 ring-2 ring-red-500/60 relative z-10'
                    : (wallPreviewMonochrome
                        ? `${t.previewBg} ring-2 ${t.ring} relative z-10`
                        : 'bg-emerald-400/10 ring-2 ring-emerald-500/50 relative z-10');
                  // Para el último slot válido (c === size-2), ampliamos SIEMPRE el área clicable
                  // para cubrir también la columna exterior.
                  // Cálculo de expansión de span en H según el shape (widthPct)
                  const addColsH = Math.max(0, Math.ceil(Math.max(0, wallHitboxShape.H.widthPct - 100) / 100) * 2);
                  const endColHRaw = gc + 2 + Math.ceil(addColsH / 2);
                  const startColHRaw = gc + 1 - Math.floor(addColsH / 2);
                  const leaderEndCol = Math.min(Math.max(gc + 4, endColHRaw), gridCount + 1);
                  const leaderStartCol = Math.max(1, startColHRaw);
                  const baseSpanH: React.CSSProperties | undefined =
                    c === size - 2 ? { gridRow: `${gr + 1} / ${gr + 2}`, gridColumn: `${leaderStartCol} / ${leaderEndCol}` } : undefined;
                  // Expansión controlada del área CLICKEABLE (no visual) en H combinando %>100 y píxeles
                  const pctStepsH = Math.max(0, Math.ceil(Math.max(0, wallHitboxShape.H.heightPct - 100) / 100) * 2);
                  const addRowsHSteps = Math.max(0, pctStepsH);
                  const endRowHRaw = gr + 2 + Math.ceil(addRowsHSteps / 2);
                  const startRowHRaw = gr + 1 - Math.floor(addRowsHSteps / 2);
                  const leaderEndRowH = Math.min(Math.max(gr + 2, endRowHRaw), gridCount + 1);
                  const leaderStartRowH = Math.max(1, startRowHRaw);
                  const wantsPctExpandH = expandClickableWithShape && ((wallHitboxShape.H.widthPct > 100) || (wallHitboxShape.H.heightPct > 100));
                  const wantsPxExpandH = Math.max(0, wallHitboxThicknessPx.H) > 0;
                  const shouldExpandH = !active && (hoverEnabled || !!pressingWall) && (wantsPctExpandH || wantsPxExpandH);
                  const spanStyle: React.CSSProperties | undefined =
                    (shouldExpandH && wantsPctExpandH)
                      ? { gridRow: `${leaderStartRowH} / ${leaderEndRowH}`, gridColumn: `${leaderStartCol} / ${leaderEndCol}` }
                      : undefined;
                  // Visual: longitud en %; grosor en PX usando wallGap (independiente del span y del thicknessPx)
                  const innerW_H = Math.min(100, wallHitboxShape.H.widthPct);
                  const innerH_HPx = Math.max(0, Math.round((wallGap * Math.min(100, wallHitboxShape.H.heightPct)) / 100));
                  const innerStyle: React.CSSProperties = {
                    width: `${innerW_H}%`,
                    height: `${innerH_HPx}px`,
                  };
                  const innerClass = active ? '' : (hoverEnabled ? hoverClass : baseHitboxClass);
                  const appliedBaseSpanH = !active ? baseSpanH : undefined;
                  // Siempre previsualizar/colocar como 2 segmentos (longitud)
                  const hoverBaseSpanH: React.CSSProperties | undefined = (!active && hoverEnabled)
                    ? { gridRow: `${gr + 1} / ${gr + 2}`, gridColumn: `${gc + 1} / ${gc + 4}` }
                    : undefined;
                  const activeLeaderSpanH: React.CSSProperties | undefined = (active && isLeaderH)
                    ? { gridRow: `${gr + 1} / ${gr + 2}`, gridColumn: `${gc + 1} / ${gc + 4}` }
                    : undefined;
                  const finalStyleH: React.CSSProperties = {
                    ...baseStyle,
                    ...(appliedBaseSpanH ?? {}),
                    ...(hoverBaseSpanH ?? {}),
                    ...(spanStyle ?? {}),
                    ...(activeLeaderSpanH ?? {}),
                  };
                  return (
                    <button
                      key={`${gr}-${gc}`}
                      style={finalStyleH}
                      className={[
                        'relative w-full h-full rounded-[2px] transition-colors grid place-items-center',
                        // Elevar cuando expandimos el span para evitar solapamientos de pointer-events
                        (spanStyle || baseSpanH) ? 'z-20' : '',
                        active && isLeaderH
                          ? (coverH?.by === 'L'
                              ? 'bg-orange-500/90 pointer-events-none z-10'
                              : coverH?.by === 'D'
                                ? 'bg-amber-900/90 pointer-events-none z-10'
                                : 'bg-amber-500/90 pointer-events-none z-10')
                          : active && !isLeaderH
                            ? 'pointer-events-none'
                            : '',
                      ].join(' ')}
                      title={`Valla H @ (${r},${c})`}
                      onClick={restrictClickToHitbox ? undefined : (() => { onWallClick('H', r, c); })}
                      onMouseEnter={() => setHover({ o: 'H', r, c })}
                      onPointerEnter={() => setHover({ o: 'H', r, c })}
                      onMouseLeave={() => { setHover(null); setPressingWall(null); }}
                      onPointerLeave={() => { setHover(null); setPressingWall(null); }}
                      onPointerDown={() => { setPressingWall({ o: 'H', r, c }); setHover({ o: 'H', r, c }); }}
                      onPointerUp={() => { setPressingWall(null); setHover(null); }}
                      onPointerCancel={() => { setPressingWall(null); setHover(null); }}
                      aria-pressed={active}
                    >
                      {/* Outline visual del hitbox total clickeable (no altera el rectángulo verde de preview) */}
                      {!active && (showWallHitboxes || hoverEnabled || !!pressingWall) && (
                        <span
                          aria-hidden
                          className={[
                            'absolute rounded-[2px] pointer-events-none',
                            'ring-1', t.ring,
                          ].join(' ')}
                          style={wantsPctExpandH
                            ? { top: 0, bottom: 0, left: 0, right: 0 }
                            : { top: -Math.max(0, wallHitboxThicknessPx.H), bottom: -Math.max(0, wallHitboxThicknessPx.H), left: 0, right: 0 }}
                        />
                      )}
                      {/* Overlay transparente: amplía área de click sin cambiar visual cuando restrictClickToHitbox está activo */}
                      {restrictClickToHitbox && !active && (wantsPctExpandH || wantsPxExpandH) && (
                        <span
                          aria-hidden
                          className="absolute"
                          style={{
                            top: -(Math.max(0, wallHitboxThicknessPx.H)),
                            bottom: -(Math.max(0, wallHitboxThicknessPx.H)),
                            left: 0,
                            right: 0,
                          }}
                          onClick={() => { onWallClick('H', r, c); }}
                        />
                      )}
                      <span
                        className={[ 'block rounded-[2px]', innerClass ].join(' ')}
                        style={innerStyle}
                        onClick={restrictClickToHitbox ? (() => { onWallClick('H', r, c); }) : undefined}
                        onMouseEnter={() => setHover({ o: 'H', r, c })}
                        onPointerEnter={() => setHover({ o: 'H', r, c })}
                        onMouseLeave={() => { setHover(null); setPressingWall(null); }}
                        onPointerLeave={() => { setHover(null); setPressingWall(null); }}
                        onPointerDown={() => { setPressingWall({ o: 'H', r, c }); setHover({ o: 'H', r, c }); }}
                        onPointerUp={() => { setPressingWall(null); setHover(null); }}
                        onPointerCancel={() => { setPressingWall(null); setHover(null); }}
                      />
                    </button>
                  );
                }
                if (evenR && !evenC) {
                  // Slot vertical (entre columnas c y c+1) en fila r,r+1
                  const r = gr / 2;
                  const c = (gc - 1) / 2;
                  const valid = r < size - 1; // índices válidos 0..size-2
                  // Una valla V colocada en (r,c) cubre dos segmentos: (r) y (r+1)
                  const wobjV_here = getWall('V', r, c);
                  const wobjV_up = r > 0 ? getWall('V', r - 1, c) : undefined;
                  const coverV = wobjV_here ?? wobjV_up;
                  const active = !!coverV;
                  const isLeaderV = !!wobjV_here;
                  if (!valid) {
                    // Borde inferior: hacer clic aquí debe actuar como si clicaras en la
                    // penúltima fila (r = size-2). También propagamos hover para el preview.
                    const proxyR = Math.max(0, size - 2);
                    // Visual: en borde proxy no hay hover activo; clamp para no inundar visualmente
                    const innerStyle: React.CSSProperties = {
                      width: `${Math.min(100, wallHitboxShape.V.widthPct)}%`,
                      height: `${Math.min(100, wallHitboxShape.V.heightPct)}%`,
                    };
                    const innerClass = baseHitboxClass;
                    return (
                      <button
                        key={`${gr}-${gc}`}
                        style={baseStyle}
                        className={[
                          'w-full h-full rounded-[2px] grid place-items-center',
                        ].join(' ')}
                        title={`Valla V @ (${proxyR},${c})`}
                        onClick={restrictClickToHitbox ? undefined : (() => { onWallClick('V', proxyR, c); })}
                        onMouseEnter={() => setHover({ o: 'V', r: proxyR, c })}
                        onPointerEnter={() => setHover({ o: 'V', r: proxyR, c })}
                        onMouseLeave={() => { setHover(null); setPressingWall(null); }}
                        onPointerLeave={() => { setHover(null); setPressingWall(null); }}
                        onPointerDown={() => { setPressingWall({ o: 'V', r: proxyR, c }); setHover({ o: 'V', r: proxyR, c }); }}
                        onPointerUp={() => { setPressingWall(null); setHover(null); }}
                        onPointerCancel={() => { setPressingWall(null); setHover(null); }}
                        aria-label={`Edge proxy V (${proxyR},${c})`}
                      >
                        <span
                          className={[ 'block rounded-[2px]', innerClass ].join(' ')}
                          style={innerStyle}
                          onClick={restrictClickToHitbox ? (() => { onWallClick('V', proxyR, c); }) : undefined}
                          onMouseEnter={() => setHover({ o: 'V', r: proxyR, c })}
                          onPointerEnter={() => setHover({ o: 'V', r: proxyR, c })}
                          onMouseLeave={() => { setHover(null); setPressingWall(null); }}
                          onPointerLeave={() => { setHover(null); setPressingWall(null); }}
                          onPointerDown={() => { setPressingWall({ o: 'V', r: proxyR, c }); setHover({ o: 'V', r: proxyR, c }); }}
                          onPointerUp={() => { setPressingWall(null); setHover(null); }}
                          onPointerCancel={() => { setPressingWall(null); setHover(null); }}
                        />
                      </button>
                    );
                  }
                  const isHover = hover && hover.o === 'V' && hover.r === r && hover.c === c && !active;
                  const hoverEnabled = (((showWallHitboxes || previewOnHoverWhenHidden) && !!isHover))
                    || (!!pressingWall && pressingWall.o === 'V' && pressingWall.r === r && pressingWall.c === c && !active);
                  const invalidPlacement = hoverEnabled && !validateWallPlacement(
                    {
                      size,
                      pawns: {
                        L: { row: pawns.L[0], col: pawns.L[1] },
                        D: { row: pawns.D[0], col: pawns.D[1] },
                      },
                      walls,
                      wallsLeft: { L: 10, D: 10 },
                      current: 'L',
                    },
                    { o: 'V', r, c },
                  );
                  const hoverClass = invalidPlacement
                    ? 'bg-red-500/15 ring-2 ring-red-500/60'
                    : (wallPreviewMonochrome
                        ? `${t.previewBg} ring-2 ${t.ring}`
                        : 'bg-emerald-400/10 ring-2 ring-emerald-500/50');
                  // Para el último slot válido (r === size-2), ampliamos SIEMPRE el área clicable
                  // para cubrir también la fila exterior.
                  // Cálculo de expansión de span en V según el shape (heightPct)
                  // En V: expandimos por la longitud (filas) con heightPct; y grosor en columnas con px/porcentaje
                  const addRowsV = Math.max(0, Math.ceil(Math.max(0, wallHitboxShape.V.heightPct - 100) / 100) * 2);
                  const endRowVRaw = gr + 2 + Math.ceil(addRowsV / 2);
                  const startRowVRaw = gr + 1 - Math.floor(addRowsV / 2);
                  const leaderEndRow = Math.min(Math.max(gr + 4, endRowVRaw), gridCount + 1);
                  const leaderStartRow = Math.max(1, startRowVRaw);
                  const baseSpanV: React.CSSProperties | undefined =
                    r === size - 2 ? { gridColumn: `${gc + 1} / ${gc + 2}`, gridRow: `${leaderStartRow} / ${leaderEndRow}` } : undefined;
                  const pctStepsVCols = Math.max(0, Math.ceil(Math.max(0, wallHitboxShape.V.widthPct - 100) / 100) * 2);
                  const addColsV = Math.max(0, pctStepsVCols);
                  const endColVRaw = gc + 2 + Math.ceil(addColsV / 2);
                  const startColVRaw = gc + 1 - Math.floor(addColsV / 2);
                  const leaderEndColV = Math.min(Math.max(gc + 2, endColVRaw), gridCount + 1);
                  const leaderStartColV = Math.max(1, startColVRaw);
                  const wantsPctExpandV = expandClickableWithShape && (wallHitboxShape.V.widthPct > 100 || wallHitboxShape.V.heightPct > 100);
                  const wantsPxExpandV = Math.max(0, wallHitboxThicknessPx.V) > 0;
                  const shouldExpandV = !active && (hoverEnabled || !!pressingWall) && (wantsPctExpandV || wantsPxExpandV);
                  const spanStyle: React.CSSProperties | undefined =
                    (shouldExpandV && wantsPctExpandV)
                      ? { gridColumn: `${leaderStartColV} / ${leaderEndColV}`, gridRow: `${leaderStartRow} / ${leaderEndRow}` }
                      : undefined;
                  // Visual: grosor en PX usando wallGap (independiente del span y del thicknessPx); longitud en %
                  const innerW_VPx = Math.max(0, Math.round((wallGap * Math.min(100, wallHitboxShape.V.widthPct)) / 100));
                  const innerH_V = Math.min(100, wallHitboxShape.V.heightPct);
                  const innerStyle: React.CSSProperties = {
                    // En V: grosor = width en PX basado en wallGap; longitud = height en %
                    width: `${innerW_VPx}px`,
                    height: `${innerH_V}%`,
                  };
                  const innerClass = active ? '' : (hoverEnabled ? hoverClass : baseHitboxClass);
                  const appliedBaseSpanV = !active ? baseSpanV : undefined;
                  // Siempre previsualizar/colocar como 2 segmentos (longitud)
                  const hoverBaseSpanV: React.CSSProperties | undefined = (!active && hoverEnabled)
                    ? { gridColumn: `${gc + 1} / ${gc + 2}`, gridRow: `${gr + 1} / ${gr + 4}` }
                    : undefined;
                  const activeLeaderSpanV: React.CSSProperties | undefined = (active && isLeaderV)
                    ? { gridColumn: `${gc + 1} / ${gc + 2}`, gridRow: `${gr + 1} / ${gr + 4}` }
                    : undefined;
                  const finalStyleV: React.CSSProperties = {
                    ...baseStyle,
                    ...(appliedBaseSpanV ?? {}),
                    ...(hoverBaseSpanV ?? {}),
                    ...(spanStyle ?? {}),
                    ...(activeLeaderSpanV ?? {}),
                  };
                  return (
                    <button
                      key={`${gr}-${gc}`}
                      style={finalStyleV}
                      className={[
                        'relative w-full h-full rounded-[2px] transition-colors grid place-items-center',
                        // Elevar cuando expandimos el span para evitar solapamientos de pointer-events
                        (spanStyle || baseSpanV) ? 'z-20' : '',
                        active && isLeaderV
                          ? (coverV?.by === 'L'
                              ? 'bg-orange-500/90 pointer-events-none z-10'
                              : coverV?.by === 'D'
                                ? 'bg-amber-900/90 pointer-events-none z-10'
                                : 'bg-amber-500/90 pointer-events-none z-10')
                          : active && !isLeaderV
                            ? 'pointer-events-none'
                            : '',
                      ].join(' ')}
                      title={`Valla V @ (${r},${c})`}
                      onClick={restrictClickToHitbox ? undefined : (() => { onWallClick('V', r, c); })}
                      onMouseEnter={() => setHover({ o: 'V', r, c })}
                      onPointerEnter={() => setHover({ o: 'V', r, c })}
                      onMouseLeave={() => { setHover(null); setPressingWall(null); }}
                      onPointerLeave={() => { setHover(null); setPressingWall(null); }}
                      onPointerDown={() => { setPressingWall({ o: 'V', r, c }); setHover({ o: 'V', r, c }); }}
                      onPointerUp={() => { setPressingWall(null); setHover(null); }}
                      onPointerCancel={() => { setPressingWall(null); setHover(null); }}
                      aria-pressed={active}
                    >
                      {/* Outline visual del hitbox total clickeable (no altera el rectángulo verde de preview) */}
                      {!active && (showWallHitboxes || hoverEnabled || !!pressingWall) && (
                        <span
                          aria-hidden
                          className={[
                            'absolute rounded-[2px] pointer-events-none',
                            'ring-1', t.ring,
                          ].join(' ')}
                          style={wantsPctExpandV
                            ? { left: 0, right: 0, top: 0, bottom: 0 }
                            : { left: -Math.max(0, wallHitboxThicknessPx.V), right: -Math.max(0, wallHitboxThicknessPx.V), top: 0, bottom: 0 }}
                        />
                      )}
                      {/* Overlay transparente: amplía área de click sin cambiar visual cuando restrictClickToHitbox está activo */}
                      {restrictClickToHitbox && !active && (wantsPctExpandV || wantsPxExpandV) && (
                        <span
                          aria-hidden
                          className="absolute"
                          style={{
                            left: -(Math.max(0, wallHitboxThicknessPx.V)),
                            right: -(Math.max(0, wallHitboxThicknessPx.V)),
                            top: 0,
                            bottom: 0,
                          }}
                          onClick={() => { onWallClick('V', r, c); }}
                        />
                      )}
                      <span
                        className={[ 'block rounded-[2px]', innerClass ].join(' ')}
                        style={innerStyle}
                        onClick={restrictClickToHitbox ? (() => { onWallClick('V', r, c); }) : undefined}
                        onMouseEnter={() => setHover({ o: 'V', r, c })}
                        onPointerEnter={() => setHover({ o: 'V', r, c })}
                        onMouseLeave={() => { setHover(null); setPressingWall(null); }}
                        onPointerLeave={() => { setHover(null); setPressingWall(null); }}
                        onPointerDown={() => { setPressingWall({ o: 'V', r, c }); setHover({ o: 'V', r, c }); }}
                        onPointerUp={() => { setPressingWall(null); setHover(null); }}
                        onPointerCancel={() => { setPressingWall(null); setHover(null); }}
                      />
                    </button>
                  );
                }
                // Junta (intersección de vallas)
                return <div key={`${gr}-${gc}`} style={baseStyle} className="w-full h-full bg-gray-800/80 rounded-sm pointer-events-none" aria-hidden />;
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
