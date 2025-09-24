import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { movePiece } from '../store/gameSlice';
import { DEFAULT_LANE_LENGTH } from '../game/board';
import type { Piece } from '../game/types';
import { coordOfPiece } from '../game/rules';
import type { RootState } from '../store';

const CELL_SIZE = 56; // px, slightly larger

export default function Board() {
  const dispatch = useAppDispatch();
  const { pieces, winner, turn } = useAppSelector((s: RootState) => s.game);

  const size = DEFAULT_LANE_LENGTH + 1; // intersections count per axis

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
    // Fallback inline styles for visibility without Tailwind
    const cellStyle: React.CSSProperties = {
      width: CELL_SIZE,
      height: CELL_SIZE,
      borderRadius: 10,
      backgroundColor: '#1f2937', // gray-800
      border: '1px solid #374151', // gray-700
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    return (
      <div key={key} className="flex items-center justify-center rounded-md bg-neutral-800 border border-neutral-700" style={cellStyle}>
        <div className="flex gap-1" style={{ display: 'flex', gap: 6 }}>
          {ps.map((p) => {
            const isLight = p.owner === 'Light';
            const isActive = p.owner === turn;
            const pieceStyle: React.CSSProperties = {
              width: 28,
              height: 28,
              borderRadius: 9999,
              border: '2px solid ' + (isLight ? '#fde68a' : '#a7f3d0'),
              backgroundColor: isLight ? '#fcd34d' : '#34d399',
              boxShadow: isActive ? '0 0 0 2px rgba(8, 145, 178, 0.35)' : 'none',
              opacity: isActive ? 1 : 0.6,
              cursor: isActive ? 'pointer' : 'not-allowed',
            };
            return (
              <button
                key={p.id}
                onClick={() => handleClickPiece(p.id)}
                title={`${p.owner} ${p.laneIndex} • ${p.state}`}
                aria-label={`Mover pieza ${p.id}`}
                className="w-7 h-7 rounded-full border transition-colors hover:ring-2 hover:ring-cyan-400 focus:outline-none"
                style={pieceStyle}
                disabled={!isActive}
              />
            );
          })}
        </div>
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

