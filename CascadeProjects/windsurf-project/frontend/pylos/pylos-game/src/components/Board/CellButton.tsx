import React from 'react';
import type { Cell, PlayerId } from '../../game/types';
import bolaA from '../../assets/bola_a.png';
import bolaB from '../../assets/bola_b.png';

export interface CellButtonProps {
  cell: Cell;
  owner: PlayerId | null;
  isValid: boolean;
  isSelected: boolean;
  isRemovable: boolean;
  inRemoval: boolean;
  showIndices?: boolean;
  onClick: (cell: Cell) => void;
}

/**
 * Botón presentacional para una celda. Memoizado para evitar re-render innecesario.
 */
const CellButton: React.FC<CellButtonProps> = ({
  cell,
  owner,
  isValid,
  isSelected,
  isRemovable,
  inRemoval,
  showIndices,
  onClick,
}) => {
  const isEmpty = owner === null;
  const classNames = [
    'pylos-cell',
    owner === 1 ? 'p1' : owner === 2 ? 'p2' : 'empty',
    isEmpty && isValid ? 'valid' : '',
    isSelected ? 'selected' : '',
    inRemoval && isRemovable ? 'removable' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const label = `${cell.layer}:${cell.x},${cell.y}`;
  const bgImage = owner === 1 ? `url(${bolaA})` : owner === 2 ? `url(${bolaB})` : 'none';

  return (
    <button
      className={classNames}
      title={label}
      onClick={() => onClick(cell)}
      aria-label={label}
      style={{ backgroundImage: bgImage }}
    >
      {showIndices && (
        <span className="idx">{cell.x},{cell.y}</span>
      )}
    </button>
  );
};

export default React.memo(CellButton);
