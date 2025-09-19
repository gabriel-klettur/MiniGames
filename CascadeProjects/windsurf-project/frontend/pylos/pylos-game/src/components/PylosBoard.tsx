import React from 'react';
import { Board } from '../game/board';
import { type Cell, LAYER_SIZES, type PlayerId, sameCell, LAYERS } from '../game/types';
import './pylos.css';
import boardImg from '../assets/board.png';
import LayerGrid from './Board/LayerGrid';
import CellButton from './Board/CellButton';
import { useBoardSizing } from './Board/useBoardSizing';

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
  const layers = LAYERS;
  const { boardRef, onHandleDown } = useBoardSizing(configMode, cellSize, gapSize, onResize);

  const renderCell = (cell: Cell) => {
    const owner = board.get(cell);
    const isEmpty = owner === null;
    const isValid = showHoles && isEmpty && board.validPlacement(cell);
    const isSelected = !!(selectedSrc && sameCell(selectedSrc, cell));
    const isRemovable = !isEmpty && board.get(cell) === currentPlayer && board.isFree(cell);

    return (
      <CellButton
        cell={cell}
        owner={owner}
        isValid={isValid}
        isSelected={isSelected}
        isRemovable={isRemovable}
        inRemoval={subphase === 'REMOVAL'}
        showIndices={showIndices}
        onClick={onCellClick}
      />
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
            <LayerGrid
              key={`layer-${layer}`}
              layer={layer}
              size={size}
              className={`layer layer-${layer}`}
              renderCell={renderCell}
            />
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
