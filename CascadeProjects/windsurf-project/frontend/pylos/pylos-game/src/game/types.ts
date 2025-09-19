// Types and shared interfaces for Pylos implementation

export type Player = 'L' | 'D'; // L = Light, D = Dark
export type Piece = Player;
export type Cell = Piece | null;

export interface Position {
  level: number; // 0..3
  row: number;   // 0..n-1 depending on level
  col: number;   // 0..n-1 depending on level
}

export type LevelGrid = Cell[][]; // row-major
export type Board = LevelGrid[];  // 4 levels: 4x4, 3x3, 2x2, 1x1

export type GamePhase = 'play' | 'selectMoveSource' | 'selectMoveDest' | 'recover';

export interface GameState {
  board: Board;
  currentPlayer: Player;
  reserves: Record<Player, number>; // remaining pieces in reserve
  phase: GamePhase;
  // UI selections
  selectedSource?: Position; // when moving
  // Recovery state when a scoring pattern is formed
  recovery?: {
    player: Player;
    remaining: number; // how many pieces the player may still recover this turn (max 2)
    minRequired: number; // usually 1 if there are recoverable pieces, otherwise 0
    removedSoFar: number; // how many recovered already
  };
}

export const PLAYERS: Player[] = ['L', 'D'];

export function otherPlayer(p: Player): Player {
  return p === 'L' ? 'D' : 'L';
}
