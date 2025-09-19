import React from 'react';
import type { Cell } from '../../game/types';

export interface LayerGridProps {
  layer: number;
  size: number;
  className?: string;
  renderCell: (cell: Cell) => React.ReactNode;
}

/**
 * Renderiza una capa del tablero como una malla (grid) de tamaño NxN.
 * Delegamos la celda a través de renderCell para mantenerlo presentacional.
 */
const LayerGrid: React.FC<LayerGridProps> = ({ layer, size, className, renderCell }) => {
  return (
    <div
      className={className ?? `layer layer-${layer}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, var(--cell))`,
        gridTemplateRows: `repeat(${size}, var(--cell))`,
      }}
    >
      {Array.from({ length: size * size }, (_, i) => {
        const x = i % size;
        const y = Math.floor(i / size);
        return (
          <React.Fragment key={`${layer}-${x}-${y}`}>
            {renderCell({ layer, x, y })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default React.memo(LayerGrid);
