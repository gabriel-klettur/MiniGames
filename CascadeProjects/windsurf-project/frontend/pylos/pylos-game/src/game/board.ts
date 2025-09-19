import type { Board, Cell, Player, Position } from './types';

export const LEVELS = 4; // 0..3

export function levelSize(level: number): number {
  return LEVELS - level; // 4,3,2,1
}

export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let l = 0; l < LEVELS; l++) {
    const size = levelSize(l);
    const grid: Cell[][] = [];
    for (let r = 0; r < size; r++) {
      const row: Cell[] = new Array(size).fill(null);
      grid.push(row);
    }
    board.push(grid);
  }
  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((grid) => grid.map((row) => row.slice()));
}

export function inBounds(pos: Position): boolean {
  const size = levelSize(pos.level);
  return (
    pos.level >= 0 && pos.level < LEVELS &&
    pos.row >= 0 && pos.row < size &&
    pos.col >= 0 && pos.col < size
  );
}

export function getCell(board: Board, pos: Position): Cell {
  return board[pos.level][pos.row][pos.col];
}

export function setCell(board: Board, pos: Position, value: Cell): Board {
  const copy = cloneBoard(board);
  copy[pos.level][pos.row][pos.col] = value;
  return copy;
}

export function positions(level?: number): Position[] {
  const result: Position[] = [];
  const lStart = level === undefined ? 0 : level;
  const lEnd = level === undefined ? LEVELS - 1 : level;
  for (let l = lStart; l <= lEnd; l++) {
    const size = levelSize(l);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        result.push({ level: l, row: r, col: c });
      }
    }
  }
  return result;
}

export function isEmpty(board: Board, pos: Position): boolean {
  return getCell(board, pos) === null;
}

export function isSupported(board: Board, pos: Position): boolean {
  if (pos.level === 0) return true;
  // needs 2x2 filled directly below
  const l = pos.level - 1;
  const r = pos.row;
  const c = pos.col;
  const below: Position[] = [
    { level: l, row: r, col: c },
    { level: l, row: r + 1, col: c },
    { level: l, row: r, col: c + 1 },
    { level: l, row: r + 1, col: c + 1 },
  ];
  // ensure all below in bounds and not null
  return below.every((p) => inBounds(p) && getCell(board, p) !== null);
}

export function canPlaceAt(board: Board, pos: Position): boolean {
  return inBounds(pos) && isEmpty(board, pos) && isSupported(board, pos);
}

export function isSupportingAny(board: Board, pos: Position): boolean {
  // if there's a piece above that uses this piece as support, then true
  const l = pos.level;
  if (l >= LEVELS - 1) return false; // top level supports nothing above
  // A piece at (l,i,j) is part of the support for above cells at (l+1, r, c) where r in {i-1,i} and c in {j-1,j}
  for (let dr = -1; dr <= 0; dr++) {
    for (let dc = -1; dc <= 0; dc++) {
      const r = pos.row + dr;
      const c = pos.col + dc;
      const above: Position = { level: l + 1, row: r, col: c };
      if (!inBounds(above)) continue;
      // above cell exists only if its support 2x2 is within bounds of current level
      // check if above cell is occupied; if occupied, then this pos must be one of its 4 supports
      if (getCell(board, above) !== null) {
        return true;
      }
    }
  }
  return false;
}

export function isFree(board: Board, pos: Position): boolean {
  // a piece is free if it exists and is not supporting any above piece
  if (isEmpty(board, pos)) return false;
  return !isSupportingAny(board, pos);
}

export function countPieces(board: Board, player: Player): number {
  let count = 0;
  for (const p of positions()) {
    if (getCell(board, p) === player) count++;
  }
  return count;
}

// Utility to build a unique string key for a board position
export function posKey(p: Position): string {
  return `${p.level}-${p.row}-${p.col}`;
}
