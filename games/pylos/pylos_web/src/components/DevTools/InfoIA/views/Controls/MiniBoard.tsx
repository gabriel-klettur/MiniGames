import { useLayoutEffect, useState, useCallback } from 'react';
import type { GameState, Position } from '../../../../../game/types';
import { posKey } from '../../../../../game/board';
import { initialState } from '../../../../../game/rules';
import Board from '../../../../Board';

export type MiniBoardProps = {
  state: GameState | null;
  onCellClick?: (pos: Position) => void;
  gameState?: GameState;
  noShade?: { 0: boolean; 1: boolean; 2: boolean; 3: boolean };
  shadeOnlyHoles?: boolean;
  showHoleBorders?: boolean;
};

const CONTAINER_SIZE = 200;

export default function MiniBoard({ state, onCellClick, noShade, shadeOnlyHoles, showHoleBorders }: MiniBoardProps) {
  const displayState = state ?? initialState();
  const isEmpty = !state;
  const handleCellClick = onCellClick ?? (() => {});

  const [boardSize, setBoardSize] = useState<number>(0);

  const measure = useCallback(() => {
    const mainBoard = document.querySelector('.content .board--pyramid') as HTMLElement | null;
    if (!mainBoard) return;
    const w = mainBoard.offsetWidth;
    if (w > 0) setBoardSize(w);
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const scale = boardSize > 0 ? CONTAINER_SIZE / boardSize : 0;

  return (
    <div className={`infoia__mini-board ${isEmpty ? 'infoia__mini-board--empty' : ''}`}>
      <div
        className="infoia__mini-board-inner"
        style={{
          width: boardSize || undefined,
          height: boardSize || undefined,
          marginLeft: boardSize ? -(boardSize / 2) : 0,
          marginTop: boardSize ? -(boardSize / 2) + 12 : 0,
          transform: `scale(${scale})`,
          visibility: boardSize > 0 ? 'visible' : 'hidden',
        }}
      >
        <Board
          state={displayState}
          onCellClick={handleCellClick}
          posKey={posKey}
          viewMode="pyramid"
          noShade={noShade}
          shadeOnlyHoles={shadeOnlyHoles}
          showHoleBorders={showHoleBorders}
        />
      </div>
    </div>
  );
}
