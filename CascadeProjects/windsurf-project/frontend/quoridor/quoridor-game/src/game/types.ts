export type Player = 'L' | 'D';

export interface Coord {
  row: number;
  col: number;
}

export type WallOrientation = 'H' | 'V';

export interface Wall {
  /**
   * Orientación de la valla: Horizontal (H) o Vertical (V)
   */
  o: WallOrientation;
  /**
   * Posición en la rejilla de vallas. Para H: filas 0..(N-2), cols 0..(N-1)
   * Para V: filas 0..(N-1), cols 0..(N-2)
   */
  r: number;
  c: number;
}

export interface GameState {
  size: number; // normal = 9
  pawns: Record<Player, Coord>;
  walls: Wall[];
  wallsLeft: Record<Player, number>; // 10 por jugador en 2P
  current: Player;
}

