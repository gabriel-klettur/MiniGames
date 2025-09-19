import { Fragment } from 'react';
import type { GameState, Position } from '../game/types';
import { LEVELS, getCell, isFree, isSupported, levelSize } from '../game/board';

export interface BoardProps {
  state: GameState;
  onCellClick: (pos: Position) => void;
  onDragStart?: (pos: Position) => void;
  onDrop?: (pos: Position) => void;
  onDragEnd?: () => void;
  highlights?: Set<string>; // position keys to highlight
  selected?: Position | undefined;
  posKey: (p: Position) => string;
  appearKeys?: Set<string>;
  flashKeys?: Set<string>;
}

export function Board({ state, onCellClick, onDragStart, onDragEnd, highlights, selected, posKey, appearKeys, flashKeys }: BoardProps) {
  return (
    <div className="board">
      {Array.from({ length: LEVELS }).map((_, level) => (
        <LevelView
          key={level}
          level={level}
          state={state}
          onCellClick={onCellClick}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          highlights={highlights}
          selected={selected}
          posKey={posKey}
          appearKeys={appearKeys}
          flashKeys={flashKeys}
        />
      ))}
    </div>
  );
}

interface LevelViewProps extends Omit<BoardProps, 'state'> {
  level: number;
  state: GameState;
}

function LevelView({ level, state, onCellClick, onDragStart, onDragEnd, highlights, selected, posKey, appearKeys, flashKeys }: LevelViewProps) {
  const size = levelSize(level);
  return (
    <div className="level" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {Array.from({ length: size }).map((_, r) => (
        <Fragment key={r}> 
          {Array.from({ length: size }).map((_, c) => {
            const pos: Position = { level, row: r, col: c };
            const cell = getCell(state.board, pos);
            const key = posKey(pos);
            const isHighlighted = highlights?.has(key) ?? false;
            const isSelected = selected && posKey(selected) === key;
            const free = cell ? isFree(state.board, pos) : false;
            const supported = !cell && isSupported(state.board, pos);
            const isAppearing = appearKeys?.has(key) ?? false;
            const isFlashing = flashKeys?.has(key) ?? false;
            const canDrag = !!cell && state.currentPlayer === cell && free && state.phase !== 'recover';
            return (
              <button
                key={c}
                className={[
                  'cell',
                  isHighlighted ? 'cell--highlight' : '',
                  supported ? 'cell--supported' : '',
                  isSelected ? 'cell--selected' : '',
                  isFlashing ? 'cell--flash' : '',
                ].join(' ')}
                onClick={() => onCellClick(pos)}
                onDragOver={(e) => { if (isHighlighted) e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); (state.phase !== 'recover') && (onCellClick(pos)); }}
                title={`L${level} (${r},${c})`}
              >
                {cell && (
                  <span className={[
                    'piece',
                    cell === 'L' ? 'piece--light' : 'piece--dark',
                    free ? 'piece--free' : 'piece--fixed',
                    isAppearing ? 'piece--appear' : '',
                  ].join(' ')}
                    draggable={canDrag}
                    onDragStart={(e) => { if (canDrag) { e.dataTransfer.setData('text/plain', key); onDragStart?.(pos); } }}
                    onDragEnd={() => { onDragEnd?.(); }}
                  />
                )}
              </button>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

export default Board;
