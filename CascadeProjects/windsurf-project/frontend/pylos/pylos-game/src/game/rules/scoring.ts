import { Board } from '../board';
import type { Cell, PlayerId } from '../types';

/**
 * Cuenta los cuadrados 2x2 formados por el jugador al colocar en una celda.
 */
export function squaresCreatedBy(board: Board, player: PlayerId, cell: Cell): number {
  const layer = cell.layer;
  if (layer >= 3) return 0;
  const size = board.sizeOfLayer(layer);
  let count = 0;
  for (const oy of [cell.y - 1, cell.y] as const) {
    for (const ox of [cell.x - 1, cell.x] as const) {
      if (ox >= 0 && oy >= 0 && ox < size - 1 && oy < size - 1) {
        const block: Cell[] = [
          { layer, x: ox, y: oy },
          { layer, x: ox + 1, y: oy },
          { layer, x: ox, y: oy + 1 },
          { layer, x: ox + 1, y: oy + 1 },
        ];
        if (block.every((b) => board.get(b) === player)) count += 1;
      }
    }
  }
  return count;
}

/**
 * Cuenta líneas completas del tamaño objetivo en la fila o columna involucrada.
 * En capa 0 el objetivo es 4; en capa 1 el objetivo es 3; en capas superiores no aplica.
 */
export function linesCreatedBy(board: Board, player: PlayerId, cell: Cell): number {
  const layer = cell.layer;
  const size = board.sizeOfLayer(layer);
  const targetLen = layer === 0 ? 4 : layer === 1 ? 3 : 0;
  if (targetLen === 0) return 0;
  let count = 0;

  // Fila
  const rowOwners = Array.from({ length: size }, (_, x) => board.get({ layer, x, y: cell.y }));
  if (rowOwners.every((o) => o === player)) {
    if (size === targetLen) count += 1;
  } else {
    for (let start = 0; start <= size - targetLen; start++) {
      const window = rowOwners.slice(start, start + targetLen);
      if (window.every((o) => o === player) && cell.x >= start && cell.x < start + targetLen) {
        count += 1;
        break;
      }
    }
  }

  // Columna
  const colOwners = Array.from({ length: size }, (_, y) => board.get({ layer, x: cell.x, y }));
  if (colOwners.every((o) => o === player)) {
    if (size === targetLen) count += 1;
  } else {
    for (let start = 0; start <= size - targetLen; start++) {
      const window = colOwners.slice(start, start + targetLen);
      if (window.every((o) => o === player) && cell.y >= start && cell.y < start + targetLen) {
        count += 1;
        break;
      }
    }
  }

  return count;
}
