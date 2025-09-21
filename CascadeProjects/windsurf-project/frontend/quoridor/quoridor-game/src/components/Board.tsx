import React from 'react';

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
   */
  walls?: Array<{ o: 'H' | 'V'; r: number; c: number }>;
  /** Evento al intentar colocar una valla en un slot. */
  onWallClick?: (o: 'H' | 'V', r: number, c: number) => void;
  /** Celdas a resaltar (sombras) para indicar movimientos legales del jugador en turno. */
  highlightCells?: Array<[number, number]>;
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
}: BoardProps) {
  // Construimos una rejilla de (2*size - 1) con pistas alternas: celda (1fr), valla (wallGap px)
  const gridCount = size * 2 - 1;
  const track = Array.from({ length: gridCount }, (_, i) => (i % 2 === 0 ? '1fr' : `${wallGap}px`)).join(' ');
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: track,
    gridTemplateRows: track,
  };

  const pawnType = (r: number, c: number) =>
    pawns.L[0] === r && pawns.L[1] === c ? 'L' : pawns.D[0] === r && pawns.D[1] === c ? 'D' : null;

  const hasWall = (o: 'H' | 'V', r: number, c: number) => walls.some((w) => w.o === o && w.r === r && w.c === c);
  const hlSet = new Set(highlightCells.map(([r, c]) => `${r},${c}`));

  // Nota: en lugar de "cubrir" celdas, hacemos que la valla activa que se expande
  // no intercepte eventos (pointer-events-none) para permitir clicks en slots adyacentes.

  return (
    <div className={["w-full", "aspect-square", "select-none", className ?? ""].join(" ").trim()}>
      <div className="grid w-full h-full bg-gray-800/60 p-1 rounded-md" style={gridStyle}>
        {Array.from({ length: gridCount }).map((_, gr) => (
          <React.Fragment key={gr}>
            {Array.from({ length: gridCount }).map((__, gc) => {
              const evenR = gr % 2 === 0;
              const evenC = gc % 2 === 0;
              if (evenR && evenC) {
                // Celda de juego
                const r = gr / 2;
                const c = gc / 2;
                const type = pawnType(r, c);
                const highlighted = hlSet.has(`${r},${c}`);
                return (
                  <button
                    key={`${gr}-${gc}`}
                    className="relative bg-gray-900/60 hover:bg-gray-800 active:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    onClick={() => onCellClick(r, c)}
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
                const active = hasWall('H', r, c);
                if (!valid) return <div key={`${gr}-${gc}`} />;
                const spanStyle = active ? { gridColumn: `${gc + 1} / ${gc + 4}` } as React.CSSProperties : undefined;
                return (
                  <button
                    key={`${gr}-${gc}`}
                    style={spanStyle}
                    className={[
                      'w-full h-full rounded-[2px] transition-colors',
                      active ? 'bg-amber-500/90 pointer-events-none z-10' : 'bg-transparent hover:bg-amber-500/50',
                    ].join(' ')}
                    title={`Valla H @ (${r},${c})`}
                    onClick={() => onWallClick('H', r, c)}
                    aria-pressed={active}
                  />
                );
              }
              if (evenR && !evenC) {
                // Slot vertical (entre columnas c y c+1) en fila r,r+1
                const r = gr / 2;
                const c = (gc - 1) / 2;
                const valid = r < size - 1; // índices válidos 0..size-2
                const active = hasWall('V', r, c);
                if (!valid) return <div key={`${gr}-${gc}`} />;
                const spanStyle = active ? { gridRow: `${gr + 1} / ${gr + 4}` } as React.CSSProperties : undefined;
                return (
                  <button
                    key={`${gr}-${gc}`}
                    style={spanStyle}
                    className={[
                      'w-full h-full rounded-[2px] transition-colors',
                      active ? 'bg-amber-500/90 pointer-events-none' : 'bg-transparent hover:bg-amber-500/50',
                    ].join(' ')}
                    title={`Valla V @ (${r},${c})`}
                    onClick={() => onWallClick('V', r, c)}
                    aria-pressed={active}
                  />
                );
              }
              // Junta (intersección de vallas)
              return <div key={`${gr}-${gc}`} className="w-full h-full bg-gray-800/80 rounded-sm" />;
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

