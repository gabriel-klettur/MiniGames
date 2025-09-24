import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { movePiece } from '../store/gameSlice';
import { DEFAULT_LANE_LENGTH } from '../game/board';
import type { Piece } from '../game/types';
import { coordOfPiece } from '../game/rules';
import type { RootState } from '../store';

const CELL_SIZE = 56; // px, slightly larger
const DOT_SIZE = 5; // px
const DOT_COLOR = '#f5e0a3'; // warm ivory/gold-like, inspired by reference
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

  const size = DEFAULT_LANE_LENGTH + 1; // intersections count per axis

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
    gridTemplateColumns: `repeat(${size}, ${CELL_SIZE}px)`,
    gridTemplateRows: `repeat(${size}, ${CELL_SIZE}px)`,
    gap: 8,
    backgroundColor: 'transparent',
    padding: 8,
    borderRadius: 12,
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  };

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
    const key = `${row}:${col}`;
    const ps = cells[key] ?? [];
    // Dimensions controlled by UI settings
    const pieceWidth = Math.max(8, Math.min(48, ui?.pieceWidth ?? 16));
    const fallbackH = Math.round(pieceWidth * 2.2);
    const pieceHeight = Math.max(24, Math.min(120, ui?.pieceHeight ?? fallbackH));
    // Fallback inline styles for visibility without Tailwind
    // Hide unused corner intersections as transparent spacers
    const size = DEFAULT_LANE_LENGTH + 1;
    const isCorner = (row === 0 || row === size - 1) && (col === 0 || col === size - 1);
    if (isCorner) {
      return (
        <div
          key={key}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            background: 'transparent',
          }}
        />
      );
    }

    const cellStyle: React.CSSProperties = {
      width: CELL_SIZE,
      height: CELL_SIZE,
      borderRadius: 10,
      backgroundColor: '#1f2937', // gray-800
      border: '1px solid #374151', // gray-700
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    };

    // Pips: indicators inspired by the physical board. Only some cells render dots for now.
    const pipInfo = getPipInfo(row, col);
    const pipContainerStyle: React.CSSProperties = (() => {
      const base: React.CSSProperties = {
        position: 'absolute',
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        justifyContent: 'center',
      };
      if (pipInfo.side === 'left' || pipInfo.side === 'right') {
        return {
          ...base,
          left: pipInfo.side === 'left' ? 4 : undefined,
          right: pipInfo.side === 'right' ? 4 : undefined,
          top: '50%',
          transform: 'translateY(-50%)',
          flexDirection: 'column',
        };
      }
      if (pipInfo.side === 'top' || pipInfo.side === 'bottom') {
        return {
          ...base,
          left: '50%',
          top: pipInfo.side === 'top' ? 4 : undefined,
          bottom: pipInfo.side === 'bottom' ? 4 : undefined,
          transform: 'translateX(-50%)',
          flexDirection: 'column', // keep vertical stacks for top/bottom as well
        };
      }
      return base;
    })();

    // Build overlay elements for this cell: pip markers + coordinate badge rX,cY
    const overlay = (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {pipInfo.count > 0 && (
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
      </div>
    );

    return (
      <div key={key} className="flex items-center justify-center rounded-md bg-neutral-800 border border-neutral-700" style={cellStyle}>
        <div className="flex gap-1" style={{ display: 'flex', gap: 6 }}>
          {ps.map((p) => {
            const isLight = p.owner === 'Light';
            const isActive = p.owner === turn;
            // Determine forward tip side based on owner and current state
            const tipSide: 'left' | 'right' | 'top' | 'bottom' = isLight
              ? (p.state === 'en_ida' ? 'left' : 'right')
              : (p.state === 'en_ida' ? 'top' : 'bottom');

            // Style per side: both use the same prism design; only color differs
            const pieceStyle: React.CSSProperties = isLight
              ? {
                  width: pieceWidth,
                  height: pieceHeight,
                  clipPath: 'polygon(50% 0%, 85% 15%, 85% 85%, 50% 100%, 15% 85%, 15% 15%)',
                  background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
                  transform: 'rotate(90deg)',
                  transformOrigin: '50% 50%',
                  boxShadow: isActive ? '0 0 0 2px rgba(8, 145, 178, 0.35)' : 'none',
                  opacity: isActive ? 1 : 0.6,
                  cursor: isActive ? 'pointer' : 'not-allowed',
                }
              : {
                  width: pieceWidth,
                  height: pieceHeight,
                  // Vertical hex/diamond-like prism to match the reference orientation
                  clipPath: 'polygon(50% 0%, 85% 15%, 85% 85%, 50% 100%, 15% 85%, 15% 15%)',
                  background: 'linear-gradient(180deg, #a54d5b 0%, #6e2430 100%)',
                  boxShadow: isActive ? '0 0 0 2px rgba(8, 145, 178, 0.35)' : 'none',
                  opacity: isActive ? 1 : 0.6,
                  cursor: isActive ? 'pointer' : 'not-allowed',
                };

            const tipSize = Math.max(12, Math.round(Math.min(pieceWidth, pieceHeight) * 0.5));
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

            // Add a triangular light cone towards the movement direction for extra emphasis
            const coneW = Math.max(16, Math.round(pieceWidth * 0.65));
            const coneH = Math.max(16, Math.round(pieceHeight * 0.65));
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
                  height: Math.round(pieceHeight * 0.8),
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
                  height: Math.round(pieceHeight * 0.8),
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
                  width: Math.round(pieceWidth * 0.8),
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
                width: Math.round(pieceWidth * 0.8),
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
              <div key={p.id} style={{ position: 'relative', width: pieceWidth, height: pieceHeight }}>
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

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="text-sm text-neutral-300">
        Turno: <span className="font-semibold">{turn}</span>
        {winner && (
          <span className="ml-3 text-emerald-400 font-semibold">Ganador: {winner}</span>
        )}
      </div>
      <div style={gridStyle}>{cellsArray}</div>
      <div className="text-xs text-neutral-400">
        Consejo: Haz clic sobre una pieza para moverla según las reglas.
      </div>
    </div>
  );
}

