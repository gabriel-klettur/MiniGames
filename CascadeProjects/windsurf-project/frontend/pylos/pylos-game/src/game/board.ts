import { Cell, LAYER_SIZES, PlayerId } from './types';

/**
 * Board represents the 4-layer Pylos pyramid (4x4 -> 1x1).
 * Stores optional ownership per cell: 1, 2 or null.
 */
export class Board {
  static readonly LAYER_SIZES = LAYER_SIZES;

  private cells: (PlayerId | null)[][][]; // [layer][y][x]
  lastPlayerToMove: PlayerId | null = null;

  constructor() {
    this.cells = LAYER_SIZES.map((size) =>
      Array.from({ length: size }, () => Array<PlayerId | null>(size).fill(null))
    );
  }

  clone(): Board {
    const b = new Board();
    b.cells = this.cells.map((layer) => layer.map((row) => row.slice()));
    b.lastPlayerToMove = this.lastPlayerToMove;
    return b;
  }

  sizeOfLayer(layer: number): number {
    return LAYER_SIZES[layer];
  }

  get(cell: Cell): PlayerId | null {
    return this.cells[cell.layer][cell.y][cell.x];
  }

  isInside(cell: Cell): boolean {
    const size = this.sizeOfLayer(cell.layer);
    return cell.layer >= 0 && cell.layer < 4 && cell.x >= 0 && cell.y >= 0 && cell.x < size && cell.y < size;
  }

  isEmpty(cell: Cell): boolean {
    return this.get(cell) === null;
  }

  isSupported(cell: Cell): boolean {
    if (cell.layer === 0) return true;
    const below = cell.layer - 1;
    const needed: Cell[] = [
      { layer: below, x: cell.x, y: cell.y },
      { layer: below, x: cell.x + 1, y: cell.y },
      { layer: below, x: cell.x, y: cell.y + 1 },
      { layer: below, x: cell.x + 1, y: cell.y + 1 },
    ];
    for (const c of needed) {
      if (!this.isInside(c)) return false;
      if (this.get(c) === null) return false;
    }
    return true;
  }

  validPlacement(cell: Cell): boolean {
    if (!this.isInside(cell)) return false;
    if (!this.isEmpty(cell)) return false;
    return this.isSupported(cell);
  }

  isFree(cell: Cell): boolean {
    // Free if has no marble above relying on it
    if (this.get(cell) === null) return false;
    if (cell.layer === 3) return true;
    const aboveLayer = cell.layer + 1;
    for (const dy of [0, -1] as const) {
      for (const dx of [0, -1] as const) {
        const ax = cell.x + dx;
        const ay = cell.y + dy;
        const size = this.sizeOfLayer(aboveLayer);
        if (ax >= 0 && ay >= 0 && ax < size && ay < size) {
          const above: Cell = { layer: aboveLayer, x: ax, y: ay };
          if (this.get(above) !== null) return false;
        }
      }
    }
    return true;
  }

  allCells(): Cell[] {
    const result: Cell[] = [];
    for (let layer = 0; layer < 4; layer++) {
      const size = this.sizeOfLayer(layer);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          result.push({ layer, x, y });
        }
      }
    }
    return result;
  }

  emptyCells(): Cell[] {
    return this.allCells().filter((c) => this.get(c) === null);
  }

  validMoves(): Cell[] {
    return this.emptyCells().filter((c) => this.isSupported(c));
  }

  place(player: PlayerId, cell: Cell): boolean {
    if (!this.validPlacement(cell)) return false;
    this.cells[cell.layer][cell.y][cell.x] = player;
    this.lastPlayerToMove = player;
    return true;
  }

  move(player: PlayerId, src: Cell, dst: Cell): boolean {
    if (this.get(src) !== player) return false;
    if (!this.isFree(src)) return false;
    if (!this.validPlacement(dst)) return false;
    if (dst.layer <= src.layer) return false;
    this.cells[src.layer][src.y][src.x] = null;
    this.cells[dst.layer][dst.y][dst.x] = player;
    this.lastPlayerToMove = player;
    return true;
  }

  removeAt(cell: Cell): PlayerId | null {
    const owner = this.get(cell);
    if (owner === null) return null;
    if (!this.isFree(cell)) return null;
    this.cells[cell.layer][cell.y][cell.x] = null;
    return owner;
  }

  squaresCreatedBy(player: PlayerId, cell: Cell): number {
    const layer = cell.layer;
    if (layer >= 3) return 0;
    const size = this.sizeOfLayer(layer);
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
          if (block.every((b) => this.get(b) === player)) count += 1;
        }
      }
    }
    return count;
  }

  linesCreatedBy(player: PlayerId, cell: Cell): number {
    const layer = cell.layer;
    const size = this.sizeOfLayer(layer);
    const targetLen = layer === 0 ? 4 : layer === 1 ? 3 : 0;
    if (targetLen === 0) return 0;
    let count = 0;
    const rowOwners = Array.from({ length: size }, (_, x) => this.get({ layer, x, y: cell.y }));
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
    const colOwners = Array.from({ length: size }, (_, y) => this.get({ layer, x: cell.x, y }));
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

  freeMarbles(player: PlayerId): Cell[] {
    return this.allCells().filter((c) => this.get(c) === player && this.isFree(c));
  }

  isApexFilled(): boolean {
    return this.get({ layer: 3, x: 0, y: 0 }) !== null;
  }

  isFull(): boolean {
    return this.allCells().every((c) => this.get(c) !== null);
  }

  countPlayerMarbles(): Record<PlayerId, number> {
    const counts: Record<PlayerId, number> = { 1: 0, 2: 0 } as const as Record<PlayerId, number>;
    for (const c of this.allCells()) {
      const p = this.get(c);
      if (p === 1 || p === 2) counts[p]! += 1;
    }
    return counts;
  }
}
