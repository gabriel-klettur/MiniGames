import { Fragment } from 'react';
import type { GameState, Position } from '../game/types';
import { LEVELS, getCell, isFree, isSupported, levelSize } from '../game/board';

export interface BoardProps {
  state: GameState;
  onCellClick: (pos: Position) => void;
  highlights?: Set<string>; // position keys to highlight
  selected?: Position | undefined;
  posKey: (p: Position) => string;
}

export function Board({ state, onCellClick, highlights, selected, posKey }: BoardProps) {
  return (
    <div className="board">
      {Array.from({ length: LEVELS }).map((_, level) => (
        <LevelView
          key={level}
          level={level}
          state={state}
          onCellClick={onCellClick}
          highlights={highlights}
          selected={selected}
          posKey={posKey}
        />
      ))}
    </div>
  );
}

interface LevelViewProps extends Omit<BoardProps, 'state'> {
  level: number;
  state: GameState;
}

function LevelView({ level, state, onCellClick, highlights, selected, posKey }: LevelViewProps) {
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
            return (
              <button
                key={c}
                className={[
                  'cell',
                  isHighlighted ? 'cell--highlight' : '',
                  supported ? 'cell--supported' : '',
                  isSelected ? 'cell--selected' : '',
                ].join(' ')}
                onClick={() => onCellClick(pos)}
                title={`L${level} (${r},${c})`}
              >
                {cell && (
                  <span className={[
                    'piece',
                    cell === 'L' ? 'piece--light' : 'piece--dark',
                    free ? 'piece--free' : 'piece--fixed',
                  ].join(' ')} />
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
