export type PlayerId = 1 | 2;

export type GamePhase = 'PLAYING' | 'ENDED';
export type TurnSubphase = 'ACTION' | 'REMOVAL';

export interface Cell {
  layer: number; // 0..3, bottom to top
  x: number;     // column index in layer
  y: number;     // row index in layer
}

export const LAYER_SIZES: readonly [number, number, number, number] = [4, 3, 2, 1];

export function sameCell(a: Cell | null | undefined, b: Cell | null | undefined): boolean {
  return !!a && !!b && a.layer === b.layer && a.x === b.x && a.y === b.y;
}
