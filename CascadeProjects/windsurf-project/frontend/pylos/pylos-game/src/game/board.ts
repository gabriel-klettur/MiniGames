import { LAYER_SIZES } from './types';
import type { Cell, PlayerId } from "./types";

/**
 * Board represents the 4-layer Pylos pyramid (4x4 -> 1x1).
 * Stores optional ownership per cell: 1, 2 or null.
 */
export class Board {
  static readonly LAYER_SIZES = LAYER_SIZES;

  private cells: (PlayerId | null)[][][]; // [layer][y][x]
  private _lastPlayerToMove: PlayerId | null = null;
  get lastPlayerToMove(): PlayerId | null { return this._lastPlayerToMove; }

  constructor() {
    this.cells = LAYER_SIZES.map((size) =>
      Array.from({ length: size }, () => Array<PlayerId | null>(size).fill(null))
    );
  }

  clone(): Board {
    const b = new Board();
    b.cells = this.cells.map((layer) => layer.map((row) => row.slice()));
    b._lastPlayerToMove = this._lastPlayerToMove;
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
    this._lastPlayerToMove = player;
    return true;
  }

  move(player: PlayerId, src: Cell, dst: Cell): boolean {
    if (this.get(src) !== player) return false;
    if (!this.isFree(src)) return false;
    if (!this.validPlacement(dst)) return false;
    if (dst.layer <= src.layer) return false;
    this.cells[src.layer][src.y][src.x] = null;
    this.cells[dst.layer][dst.y][dst.x] = player;
    this._lastPlayerToMove = player;
    return true;
  }

  removeAt(cell: Cell): PlayerId | null {
    const owner = this.get(cell);
    if (owner === null) return null;
    if (!this.isFree(cell)) return null;
    this.cells[cell.layer][cell.y][cell.x] = null;
    return owner;
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

  // --- Serialization helpers ---
  toJSON(): { cells: (PlayerId | null)[][][]; lastPlayerToMove: PlayerId | null } {
    return {
      cells: this.cells.map((layer) => layer.map((row) => row.slice())),
      lastPlayerToMove: this._lastPlayerToMove,
    };
  }

  static fromJSON(data: { cells: (PlayerId | null)[][][]; lastPlayerToMove: PlayerId | null }): Board {
    const b = new Board();
    const maxLayers = Math.min(data.cells?.length ?? 0, 4);
    for (let layer = 0; layer < maxLayers; layer++) {
      const size = LAYER_SIZES[layer];
      const srcLayer = data.cells[layer] ?? [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const v = (srcLayer[y]?.[x] ?? null) as PlayerId | null;
          b.cells[layer][y][x] = v;
        }
      }
    }
    b._lastPlayerToMove = data.lastPlayerToMove ?? null;
    return b;
  }
}
