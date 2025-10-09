import React, { useLayoutEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { movePiece } from '../../store/gameSlice';
import { DEFAULT_LANE_LENGTH } from '../../game/board';
import type { Piece } from '../../game/types';
import { coordOfPiece } from '../../game/rules';
import type { RootState } from '../../store';
import { getBoardProfile } from '../boardProfiles';
import fichaAmarilla from '../../assets/ficha_amarilla.png';
import fichaRoja from '../../assets/ficha_roja.png';

const GAP = 8; // px between cells
const EDGE_SAFE = 12; // px safety on each side to avoid visual clipping at edges
const DOT_SIZE = 5; // px
const DOT_COLOR = '#f5e0a3'; // warm ivory/gold-like, inspired by reference
// Feature flag: render pieces on a single absolute layer centered on intersections
const USE_ABSOLUTE_LAYER = true;
const USE_DIRECTION_OVERLAY = false; // disable cone/tip overlays when using sprite images
// Unified visual themes so both sides share the same design and only differ by color
const THEMES = {
  Light: {
    tipGradient:
      'radial-gradient(circle at 50% 50%, rgba(255,255,235,1) 0%, rgba(255,240,180,0.9) 40%, rgba(255,220,150,0.65) 60%, rgba(0,0,0,0) 80%)',
    coneBright: 'rgba(255, 235, 180, 0.95)',
    coneFade: 'rgba(255, 215, 130, 0)',
  },
  Dark: {
    tipGradient:
      'radial-gradient(circle at 50% 50%, rgba(255,220,225,1) 0%, rgba(255,170,185,0.9) 40%, rgba(220,120,140,0.55) 60%, rgba(0,0,0,0) 80%)',
    coneBright: 'rgba(255, 170, 185, 0.95)',
    coneFade: 'rgba(220, 120, 140, 0)',
  },
} as const;

export default function Board() {
  const dispatch = useAppDispatch();
  const { pieces, winner, turn, ui, lanesByPlayer } = useAppSelector((s: RootState) => s.game);
  const orientation = ui?.orientation ?? 'classic';
  const profile = getBoardProfile(orientation);

  const size = DEFAULT_LANE_LENGTH + 1; // intersections count per axis

  // Dynamically compute cell size so the board (square) fits in the viewport
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [cellPx, setCellPx] = useState<number>(48);

  useLayoutEffect(() => {
    function compute() {
      const vh = window.innerHeight;
      // Prefer the parent container's inner width to avoid scrollbar/calc mismatches
      const parentEl = gridRef.current?.parentElement;
      const parentRectWidth = parentEl?.getBoundingClientRect().width;
      const cs = parentEl ? getComputedStyle(parentEl) : null;
      const padL = cs ? parseFloat(cs.paddingLeft || '0') : 0;
      const padR = cs ? parseFloat(cs.paddingRight || '0') : 0;
      const fallbackWidth = document.documentElement.clientWidth; // excludes scrollbar
      const containerWidth = (parentRectWidth ?? fallbackWidth);
      // Use content width by subtracting paddings
      const availableWidth = Math.max(0, containerWidth - padL - padR);
      // Measure the distance from the grid to the bottom of the viewport
      const top = gridRef.current?.getBoundingClientRect().top ?? 0;
      // Reserve a small bottom padding so content below doesn't force scroll
      const bottomReserve = 12;
      const availableHeight = Math.max(0, vh - top - bottomReserve);
      // Compute max cell size by width and height constraints
      const byWidth = (availableWidth - EDGE_SAFE * 2 - GAP * (size - 1)) / size;
      const byHeight = (availableHeight - GAP * (size - 1)) / size;
      const px = Math.floor(Math.max(10, Math.min(byWidth, byHeight)));
      setCellPx(px);
    }
    compute();
    const ro = new ResizeObserver(compute);
    if (gridRef.current) ro.observe(gridRef.current);
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    // Recompute after initial paint in case fonts/layout shift
    const t = setTimeout(compute, 0);
    return () => {
      clearTimeout(t);
      ro.disconnect();
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, [size]);

  // Helpers to map logical orientation to display orientation
  const mapRowCol = (row: number, col: number) => {
    const L = DEFAULT_LANE_LENGTH;
    // Invert logic: classic is flipped, bga is identity
    if (orientation === 'classic') return { row: L - row, col: L - col };
    return { row, col };
  };
  const mapSide = (s: 'left' | 'right' | 'top' | 'bottom' | undefined) => {
    if (!s) return undefined;
    // Invert only for classic; bga keeps natural sides
    if (orientation !== 'classic') return s;
    if (s === 'left') return 'right';
    if (s === 'right') return 'left';
    if (s === 'top') return 'bottom';
    return 'top';
  };

  // Derive pip counts from the game's lane speeds so visuals and rules always match.
  // Mapping of edges to speeds:
  // - Left edge (c=0, rows 1..L-1): Light speedBack per laneIndex (row-1)
  // - Right edge (c=L, rows 1..L-1): Light speedOut per laneIndex (row-1)
  // - Top edge (r=0, cols 1..L-1): Dark speedBack per laneIndex (col-1)
  // - Bottom edge (r=L, cols 1..L-1): Dark speedOut per laneIndex (col-1)
  const getPipInfo = (
    row: number,
    col: number,
  ): { count: number; side?: 'left' | 'right' | 'top' | 'bottom' } => {
    const L = DEFAULT_LANE_LENGTH; // equals size - 1
    // Left edge (Light back)
    if (col === 0 && row >= 1 && row <= L) {
      const lane = lanesByPlayer.Light[row - 1];
      if (lane) return { count: lane.speedBack, side: 'left' };
    }
    // Right edge (Light out)
    if (col === L && row >= 1 && row <= L) {
      const lane = lanesByPlayer.Light[row - 1];
      if (lane) return { count: lane.speedOut, side: 'right' };
    }
    // Top edge (Dark back)
    if (row === 0 && col >= 1 && col <= L) {
      const lane = lanesByPlayer.Dark[col - 1];
      if (lane) return { count: lane.speedBack, side: 'top' };
    }
    // Bottom edge (Dark out)
    if (row === L && col >= 1 && col <= L) {
      const lane = lanesByPlayer.Dark[col - 1];
      if (lane) return { count: lane.speedOut, side: 'bottom' };
    }
    return { count: 0 };
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
    gridTemplateRows: `repeat(${size}, ${cellPx}px)`,
    gap: GAP,
    backgroundColor: 'transparent',
    backgroundImage: `url(${profile.image})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    // Stretch to fit the computed square; assets are square so this should not distort
    backgroundSize: '100% 100%',
    padding: 0,
    borderRadius: 12,
    boxShadow: 'none',
    width: Math.max(0, size * cellPx + GAP * (size - 1)),
    maxWidth: '100%',
    overflow: 'hidden',
    position: 'relative',
  } as React.CSSProperties;

  // Build mapping from (row,col) to pieces present there
  const cells: Record<string, Piece[]> = {};
  for (const p of pieces) {
    if (p.state === 'retirada') continue;
    const { row, col } = coordOfPiece(p);
    const key = `${row}:${col}`;
    if (!cells[key]) cells[key] = [];
    cells[key].push(p);
  }

  const handleClickPiece = (id: string) => {
    if (winner) return; // no moves if game finished
    dispatch(movePiece(id));
  };

  const renderCell = (row: number, col: number): React.ReactElement => {
    // Map display coordinates to source coordinates depending on orientation
    const L = DEFAULT_LANE_LENGTH;
    // Invert: under classic we flip, under bga we pass-through
    const srcRow = orientation === 'classic' ? (L - row) : row;
    const srcCol = orientation === 'classic' ? (L - col) : col;
    const key = `${srcRow}:${srcCol}`;
    const ps = cells[key] ?? [];
    // Dimensions controlled by UI settings
    const pieceWidth = Math.max(8, Math.min(Math.floor(cellPx * 0.8), ui?.pieceWidth ?? 16));
    const fallbackH = Math.round(pieceWidth * 2.2);
    const pieceHeight = Math.max(24, Math.min(Math.floor(cellPx * 0.9), ui?.pieceHeight ?? fallbackH));
    // Fallback inline styles for visibility without Tailwind
    // Hide unused corner intersections as transparent spacers
    const size = DEFAULT_LANE_LENGTH + 1;
    const isCorner = (row === 0 || row === size - 1) && (col === 0 || col === size - 1);
    if (isCorner) {
      return (
        <div
          key={key}
          style={{
            width: cellPx,
            height: cellPx,
            background: 'transparent',
          }}
        />
      );
    }

    const cellStyle: React.CSSProperties = {
      width: cellPx,
      height: cellPx,
      boxSizing: 'border-box',
      borderRadius: 10,
      // Transparent cells to reveal the board artwork underneath
      backgroundColor: 'transparent',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    };

    // Pips: indicators inspired by the physical board. Only some cells render dots for now.
    const pipInfo = getPipInfo(srcRow, srcCol);
    const displaySide = mapSide(pipInfo.side);
    const pipContainerStyle: React.CSSProperties = (() => {
      const base: React.CSSProperties = {
        position: 'absolute',
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        justifyContent: 'center',
      };
      if (displaySide === 'left' || displaySide === 'right') {
        return {
          ...base,
          left: displaySide === 'left' ? 4 : undefined,
          right: displaySide === 'right' ? 4 : undefined,
          top: '50%',
          transform: 'translateY(-50%)',
          flexDirection: 'column',
        };
      }
      if (displaySide === 'top' || displaySide === 'bottom') {
        return {
          ...base,
          left: '50%',
          top: displaySide === 'top' ? 4 : undefined,
          bottom: displaySide === 'bottom' ? 4 : undefined,
          transform: 'translateX(-50%)',
          flexDirection: 'column', // keep vertical stacks for top/bottom as well
        };
      }
      return base;
    })();

    // Build overlay elements for this cell: pip markers + coordinate badge rX,cY
    const overlay = (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {ui?.showPipIndicators && pipInfo.count > 0 && (
          <div aria-hidden style={pipContainerStyle}>
            {Array.from({ length: pipInfo.count }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                  borderRadius: DOT_SIZE,
                  backgroundColor: DOT_COLOR,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.35)',
                  opacity: 0.95,
                }}
              />
            ))}
          </div>
        )}
        {ui?.showCoordsOverlay && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: 4,
              backgroundColor: '#000',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 6,
              padding: '1px 4px',
              opacity: 0.85,
              lineHeight: 1,
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1)'
            }}
          >
            {`r${row},c${col}`}
          </div>
        )}
      </div>
    );

    // Compute a compact grid for this cell (kept only when not using absolute layer)
    const m = ps.length;
    const cols = Math.max(1, Math.ceil(Math.sqrt(m)));
    const rows = Math.max(1, Math.ceil(m / cols));
    const padIn = 2;
    const gapIn = 4;
    const tileW = Math.max(8, Math.floor((cellPx - padIn * 2 - gapIn * (cols - 1)) / cols));
    const tileH = Math.max(12, Math.floor((cellPx - padIn * 2 - gapIn * (rows - 1)) / rows));

    return (
      <div key={key} className="flex items-center justify-center rounded-md bg-neutral-800 border border-neutral-700" style={cellStyle}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {!USE_ABSOLUTE_LAYER && ps.map((p, idx) => {
            const isLight = p.owner === 'Light';
            const isActive = p.owner === turn;
            // Grid placement within the cell
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            const w = Math.min(pieceWidth, tileW);
            const h = Math.min(pieceHeight, tileH);
            const left = padIn + c * (tileW + gapIn) + Math.max(0, Math.floor((tileW - w) / 2));
            const top = padIn + r * (tileH + gapIn) + Math.max(0, Math.floor((tileH - h) / 2));

            // Determine forward tip side based on owner and current state
            const tipSideRaw: 'left' | 'right' | 'top' | 'bottom' = isLight
              ? (p.state === 'en_ida' ? 'left' : 'right')
              : (p.state === 'en_ida' ? 'top' : 'bottom');
            const tipSide: 'left' | 'right' | 'top' | 'bottom' = mapSide(tipSideRaw) ?? tipSideRaw;

            // Style per side: both use the same prism design; only color differs
            const pieceStyle: React.CSSProperties = isLight
              ? {
                  width: w,
                  height: h,
                  clipPath: 'polygon(50% 0%, 85% 15%, 85% 85%, 50% 100%, 15% 85%, 15% 15%)',
                  background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                  transform: 'rotate(90deg)',
                  transformOrigin: '50% 50%',
                  boxShadow: isActive
                    ? '0 0 0 2px rgba(8, 145, 178, 0.35), 0 2px 4px rgba(0,0,0,0.45), 0 10px 24px rgba(0,0,0,0.35)'
                    : '0 2px 4px rgba(0,0,0,0.45), 0 10px 24px rgba(0,0,0,0.35)',
                  opacity: isActive ? 1 : 0.6,
                  cursor: isActive ? 'pointer' : 'not-allowed',
                }
              : {
                  width: w,
                  height: h,
                  clipPath: 'polygon(50% 0%, 85% 15%, 85% 85%, 50% 100%, 15% 85%, 15% 15%)',
                  background: 'linear-gradient(180deg, #a54d5b 0%, #6e2430 100%)',
                  boxShadow: isActive
                    ? '0 0 0 2px rgba(8, 145, 178, 0.35), 0 2px 4px rgba(0,0,0,0.45), 0 10px 24px rgba(0,0,0,0.35)'
                    : '0 2px 4px rgba(0,0,0,0.45), 0 10px 24px rgba(0,0,0,0.35)',
                  opacity: isActive ? 1 : 0.6,
                  cursor: isActive ? 'pointer' : 'not-allowed',
                };

            const tipSize = Math.max(10, Math.round(Math.min(w, h) * 0.5));
            const theme = p.owner === 'Light' ? THEMES.Light : THEMES.Dark;
            const tipGlowStyle: React.CSSProperties = (() => {
              const base: React.CSSProperties = {
                position: 'absolute',
                width: tipSize,
                height: tipSize,
                borderRadius: '50%',
                background: theme.tipGradient,
                filter: 'blur(1px)',
                pointerEvents: 'none',
                mixBlendMode: 'screen',
                boxShadow: `0 0 12px ${theme.coneBright}, 0 0 24px ${theme.coneBright}`,
              };
              if (tipSide === 'left') return { ...base, left: 2, top: '50%', transform: 'translateY(-50%)' };
              if (tipSide === 'right') return { ...base, right: 2, top: '50%', transform: 'translateY(-50%)' };
              if (tipSide === 'top') return { ...base, top: 2, left: '50%', transform: 'translateX(-50%)' };
              return { ...base, bottom: 2, left: '50%', transform: 'translateX(-50%)' };
            })();

            // Directional cone scaled to the adaptive size
            const coneW = Math.max(12, Math.round(w * 0.65));
            const coneH = Math.max(12, Math.round(h * 0.65));
            const coneBase: React.CSSProperties = {
              position: 'absolute',
              pointerEvents: 'none',
              opacity: 0.9,
              mixBlendMode: 'screen',
              filter: 'blur(0.6px)',
              zIndex: 1,
            };
            const bright = theme.coneBright;
            const fade = theme.coneFade;
            const directionConeStyle: React.CSSProperties = (() => {
              if (tipSide === 'left') {
                return {
                  ...coneBase,
                  width: coneW,
                  height: Math.round(h * 0.8),
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  clipPath: 'polygon(100% 0%, 0% 50%, 100% 100%)',
                  background: `linear-gradient(90deg, ${bright} 0%, ${fade} 70%)`,
                  boxShadow: '0 0 18px rgba(255,230,150,0.9) inset',
                };
              }
              if (tipSide === 'right') {
                return {
                  ...coneBase,
                  width: coneW,
                  height: Math.round(h * 0.8),
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)',
                  background: `linear-gradient(270deg, ${bright} 0%, ${fade} 70%)`,
                  boxShadow: '0 0 18px rgba(255,230,150,0.9) inset',
                };
              }
              if (tipSide === 'top') {
                return {
                  ...coneBase,
                  width: Math.round(w * 0.8),
                  height: coneH,
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  clipPath: 'polygon(0% 100%, 50% 0%, 100% 100%)',
                  background: `linear-gradient(180deg, ${bright} 0%, ${fade} 70%)`,
                  boxShadow: '0 0 18px rgba(255,230,150,0.9) inset',
                };
              }
              return {
                ...coneBase,
                width: Math.round(w * 0.8),
                height: coneH,
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                clipPath: 'polygon(0% 0%, 50% 100%, 100% 0%)',
                background: `linear-gradient(0deg, ${bright} 0%, ${fade} 70%)`,
                boxShadow: '0 0 18px rgba(255,230,150,0.9) inset',
              };
            })();

            return (
              <div key={p.id} style={{ position: 'absolute', left, top, width: w, height: h }}>
                <button
                  onClick={() => handleClickPiece(p.id)}
                  title={`${p.owner} ${p.laneIndex} • ${p.state}`}
                  aria-label={`Mover pieza ${p.id}`}
                  className="transition-colors hover:ring-2 hover:ring-cyan-400 focus:outline-none"
                  style={pieceStyle}
                  disabled={!isActive}
                />
                {/* Directional emphasis: cone + tip glow */}
                <span aria-hidden style={directionConeStyle} />
                <span aria-hidden style={tipGlowStyle} />
              </div>
            );
          })}
        </div>
        {overlay}
      </div>
    );
  };

  const cellsArray: React.ReactElement[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      cellsArray.push(renderCell(r, c));
    }
  }

  // Absolute layer: compute piece elements positioned at intersection centers
  const basePitch = profile.getPitch(cellPx, GAP);
  const baseOrigin = profile.getOrigin(0);
  const cal = ui?.calibration ?? { originX: 0, originY: 0, pitchScaleX: 1, pitchScaleY: 1, showOverlay: false };
  const pitchX = Math.max(4, basePitch * (Number.isFinite(cal.pitchScaleX) ? cal.pitchScaleX : 1));
  const pitchY = Math.max(4, basePitch * (Number.isFinite(cal.pitchScaleY) ? cal.pitchScaleY : 1));
  const origin = { x: baseOrigin.x + (cal.originX || 0), y: baseOrigin.y + (cal.originY || 0) };
  const showPieces = ui?.showPieces !== false;
  const animMs = Math.max(0, Math.min(2000, ui?.pieceAnimMs ?? 200));
  // Rotate sprites to match start direction: BGA = 0°, classic = 180°
  const rotationDeg = orientation === 'classic' ? 180 : 0;
  // Baseline long side for sprites (affects scaleY mapping)
  const heightBaseline = 44;
  const pieceElements = (USE_ABSOLUTE_LAYER && showPieces)
    ? pieces.filter((p) => p.state !== 'retirada').map((p) => {
        const { row, col } = coordOfPiece(p);
        const { row: dRow, col: dCol } = mapRowCol(row, col);
        const cx = origin.x + dCol * pitchX + cellPx / 2;
        const cy = origin.y + dRow * pitchY + cellPx / 2;
        const isLight = p.owner === 'Light';
        const isActive = p.owner === turn;
        // Size pieces relative to pitch for consistent spacing on any device
        const minW = 12;
        const basis = Math.min(pitchX, pitchY);
        // Allow growing beyond one cell: cap ~2x of basis to avoid absurd sizes
        const maxW = Math.max(16, Math.round(basis * 2.0));
        const scale = (() => {
          const s = ui?.pieceScale;
          if (typeof s === 'number' && isFinite(s)) return Math.max(0.3, Math.min(2.0, s));
          return 0.7; // default
        })();
        const baseW = basis * scale;
        const wScale = isLight ? (ui?.pieceWidthScaleLight ?? 1) : (ui?.pieceWidthScaleDark ?? 1);
        const safeWScale = Math.max(0.5, Math.min(2.0, Number.isFinite(wScale) ? (wScale as number) : 1));
        const w = Math.max(minW, Math.min(Math.round(baseW * safeWScale), maxW));
        const src = isLight ? fichaAmarilla : fichaRoja;
        // Owner-specific vertical stretch
        const rawH = isLight
          ? (ui?.pieceHeightLight ?? ui?.pieceHeight ?? heightBaseline)
          : (ui?.pieceHeightDark ?? ui?.pieceHeight ?? heightBaseline);
        const pieceStretchY = Math.max(0.5, Math.min(2.0, (rawH || heightBaseline) / heightBaseline));
        return (
          <div
            key={p.id}
            className="piece-anim"
            style={{
              position: 'absolute',
              left: cx,
              top: cy,
              width: w,
              transform: `translate(-50%, -50%)${rotationDeg ? ` rotate(${rotationDeg}deg)` : ''}${pieceStretchY !== 1 ? ` scaleY(${pieceStretchY})` : ''}`,
              willChange: 'left, top',
              zIndex: 3,
              transition: animMs <= 0 ? 'none' : `left ${animMs}ms ease, top ${animMs}ms ease`,
            }}
          >
            <button
              onClick={() => handleClickPiece(p.id)}
              title={`${p.owner} ${p.laneIndex} • ${p.state}`}
              aria-label={`Mover pieza ${p.id}`}
              disabled={!isActive}
              style={{
                display: 'block',
                width: '100%',
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: isActive ? 'pointer' : 'not-allowed',
              }}
            >
              <img
                src={src}
                alt={isLight ? 'Ficha amarilla' : 'Ficha roja'}
                draggable={false}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45)) drop-shadow(0 10px 24px rgba(0,0,0,0.35))',
                }}
              />
            </button>
            {USE_DIRECTION_OVERLAY && (
              <div
                aria-hidden
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              />
            )}
          </div>
        );
      })
    : null;

  return (
    <div className="w-full flex flex-col items-center gap-1">
      {winner && (
        <div className="text-sm text-neutral-300">
          <span className="text-emerald-400 font-semibold">Ganador: {winner}</span>
        </div>
      )}
      <div ref={gridRef} style={gridStyle}>
        {/* Calibration overlay: intersections markers */}
        {ui?.calibration?.showOverlay && (
          <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
            {Array.from({ length: size }).map((_, r) => (
              Array.from({ length: size }).map((__, c) => {
                const { row: dr, col: dc } = mapRowCol(r, c);
                const x = origin.x + dc * pitchX + cellPx / 2;
                const y = origin.y + dr * pitchY + cellPx / 2;
                return (
                  <div
                    key={`mk-${r}-${c}`}
                    style={{
                      position: 'absolute',
                      left: Math.round(x),
                      top: Math.round(y),
                      width: 8,
                      height: 8,
                      transform: 'translate(-50%, -50%)',
                      borderRadius: 8,
                      backgroundColor: 'rgba(59,130,246,0.9)', // blue-500
                      boxShadow: '0 0 0 1px #000, 0 0 4px rgba(59,130,246,0.8)',
                      opacity: 0.9,
                    }}
                  />
                );
              })
            ))}
          </div>
        )}
        {USE_ABSOLUTE_LAYER && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
            {pieceElements}
          </div>
        )}
        {cellsArray}
      </div>
    </div>
  );
}

