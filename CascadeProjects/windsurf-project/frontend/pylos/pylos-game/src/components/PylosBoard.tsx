import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Board } from '../game/board';
import { type Cell, LAYER_SIZES, type PlayerId, sameCell } from '../game/types';
import './pylos.css';
import boardImg from '../assets/board.png';
import bolaA from '../assets/bola_a.png';
import bolaB from '../assets/bola_b.png';

export interface PylosBoardProps {
  board: Board;
  currentPlayer: PlayerId;
  subphase: 'ACTION' | 'REMOVAL';
  selectedSrc: Cell | null;
  onCellClick: (cell: Cell) => void;
  onFinishRemoval?: () => void;
  canFinishRemoval?: boolean;
  showHoles?: boolean;
  showIndices?: boolean;
  cellSize?: number; // pixels for --cell
  gapSize?: number;  // pixels for --gap
  configMode?: boolean; // when true, show yellow border and handles
  onResize?: (nextCell: number, nextGap: number) => void;
}

/**
 * PylosBoard renders the 4 layers as nested CSS grids with offsets.
 * Interaction is delegated via onCellClick.
 */
export const PylosBoard: React.FC<PylosBoardProps> = ({
  board,
  currentPlayer,
  subphase,
  selectedSrc,
  onCellClick,
  onFinishRemoval,
  canFinishRemoval,
  showHoles = false,
  showIndices = false,
  cellSize,
  gapSize,
  configMode = false,
  onResize,
}) => {
  const layers = [0, 1, 2, 3] as const;

  const boardRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<null | { corner: 'tl'|'tr'|'bl'|'br'; startX: number; startY: number; startW: number; startCell: number; startGap: number; minRatio: number; maxRatio: number }>(null);

  const onHandleDown = (e: React.MouseEvent, corner: 'tl'|'tr'|'bl'|'br') => {
    if (!configMode) return;
    e.preventDefault();
    e.stopPropagation();
    const el = boardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startW = rect.width;
    const startCell = cellSize ?? 48;
    const startGap = gapSize ?? 6;
    // Compute ratio bounds from cell/gap hard limits
    const minRatio = Math.max(36 / startCell, 4 / startGap);
    const maxRatio = Math.min(96 / startCell, 16 / startGap);
    setDragging({ corner, startX: e.clientX, startY: e.clientY, startW, startCell, startGap, minRatio, maxRatio });
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const signX = dragging.corner.includes('r') ? 1 : -1;
    const signY = dragging.corner.includes('b') ? 1 : -1;
    const delta = ((e.clientX - dragging.startX) * signX + (e.clientY - dragging.startY) * signY) / 2;
    const newW = Math.max(50, dragging.startW + delta);
    let ratio = newW / dragging.startW;
    ratio = Math.max(dragging.minRatio, Math.min(dragging.maxRatio, ratio));
    const nextCell = Math.round(dragging.startCell * ratio);
    const nextGap = Math.round(dragging.startGap * ratio);
    onResize?.(nextCell, nextGap);
  }, [dragging, onResize]);

  const onMouseUp = useCallback(() => {
    if (dragging) setDragging(null);
  }, [dragging]);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp]);

  const renderCell = (cell: Cell) => {
    const owner = board.get(cell);
    const isEmpty = owner === null;
    const isValid = isEmpty && board.validPlacement(cell);
    const isSelected = selectedSrc && sameCell(selectedSrc, cell);
    const isRemovable = !isEmpty && board.get(cell) === currentPlayer && board.isFree(cell);

    const classNames = [
      'pylos-cell',
      owner === 1 ? 'p1' : owner === 2 ? 'p2' : 'empty',
      (showHoles && isValid) ? 'valid' : '',
      isSelected ? 'selected' : '',
      subphase === 'REMOVAL' && isRemovable ? 'removable' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const label = `${cell.layer}:${cell.x},${cell.y}`;
    const bgImage = owner === 1 ? `url(${bolaA})` : owner === 2 ? `url(${bolaB})` : 'none';

    return (
      <button
        key={`${cell.layer}-${cell.x}-${cell.y}`}
        className={classNames}
        title={label}
        onClick={() => onCellClick(cell)}
        aria-label={label}
        style={{ backgroundImage: bgImage }}
      >
        {showIndices && (
          <span className="idx">{cell.x},{cell.y}</span>
        )}
      </button>
    );
  };

  return (
    <div className="pylos-wrap">
      <div
        ref={boardRef}
        className={`pylos-board${configMode ? ' calib-active' : ''}`}
        style={{
          backgroundImage: `url(${boardImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          ...(cellSize ? ({ ['--cell' as any]: `${cellSize}px` } as React.CSSProperties) : {}),
          ...(gapSize ? ({ ['--gap' as any]: `${gapSize}px` } as React.CSSProperties) : {}),
        }}
      >
        {layers.map((layer) => {
          const size = LAYER_SIZES[layer];
          return (
            <div
              key={`layer-${layer}`}
              className={`layer layer-${layer}`}
              style={{
                gridTemplateColumns: `repeat(${size}, var(--cell))`,
                gridTemplateRows: `repeat(${size}, var(--cell))`,
              }}
            >
              {Array.from({ length: size * size }, (_, i) => {
                const x = i % size;
                const y = Math.floor(i / size);
                return renderCell({ layer, x, y });
              })}
            </div>
          );
        })}
        {configMode && (
          <>
            <div className="calib-handle tl" onMouseDown={(e) => onHandleDown(e, 'tl')} />
            <div className="calib-handle tr" onMouseDown={(e) => onHandleDown(e, 'tr')} />
            <div className="calib-handle bl" onMouseDown={(e) => onHandleDown(e, 'bl')} />
            <div className="calib-handle br" onMouseDown={(e) => onHandleDown(e, 'br')} />
          </>
        )}
      </div>
      {subphase === 'REMOVAL' && onFinishRemoval && (
        <div className="toolbar">
          <button className="finish-btn" onClick={onFinishRemoval} disabled={!canFinishRemoval}>
            Finish Removal
          </button>
        </div>
      )}
    </div>
  );
};

export default PylosBoard;
