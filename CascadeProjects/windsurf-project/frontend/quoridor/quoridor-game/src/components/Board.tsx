import React from 'react';

export interface BoardProps {
  size?: number; // default 9
  className?: string;
  onCellClick?: (row: number, col: number) => void;
  pawns?: { L: [number, number]; D: [number, number] };
}

/**
 * Board — Tablero presentacional de Quoridor (placeholder). Muestra una cuadrícula y peones.
 */
export default function Board({
  size = 9,
  className,
  onCellClick = () => {},
  pawns = { L: [0, Math.floor(9 / 2)], D: [8, Math.floor(9 / 2)] },
}: BoardProps) {
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
  };

  const pawnType = (r: number, c: number) =>
    pawns.L[0] === r && pawns.L[1] === c ? 'L' : pawns.D[0] === r && pawns.D[1] === c ? 'D' : null;

  return (
    <div className={["w-full", "aspect-square", "select-none", className ?? ""].join(" ").trim()}>
      <div
        className="grid w-full h-full gap-px bg-gray-800/60 p-1 rounded-md"
        style={gridStyle}
      >
        {Array.from({ length: size }).map((_, r) => (
          <React.Fragment key={r}>
            {Array.from({ length: size }).map((__, c) => {
              const type = pawnType(r, c);
              return (
                <button
                  key={`${r}-${c}`}
                  className="relative bg-gray-900/60 hover:bg-gray-800 active:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  onClick={() => onCellClick(r, c)}
                  title={`(${r}, ${c})`}
                >
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
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

