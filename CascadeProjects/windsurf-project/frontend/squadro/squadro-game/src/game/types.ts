// Core type definitions for Squadro game logic
// These interfaces model lanes, pieces, and the overall game state.

export type Player = 'Light' | 'Dark';

export type PieceState = 'en_ida' | 'en_vuelta' | 'retirada';

export interface Lane {
  // Discrete positions along a lane, including both edges (0..length)
  length: number; // number of steps from one edge to the opposite
  speedOut: number; // speed used while the piece is going out (en_ida)
  speedBack: number; // speed used while the piece is returning (en_vuelta)
}

export interface Piece {
  id: string;
  owner: Player;
  laneIndex: number; // 0..4 per player
  pos: number; // 0 = owner start edge, lane.length = opposite edge

  state: PieceState; // en_ida | en_vuelta | retirada
}

export interface GameState {
  lanesByPlayer: Record<Player, Lane[]>; // 5 lanes per player
  pieces: Piece[]; // 10 pieces total
  turn: Player;
  winner?: Player;
}

// Board grid coordinate (row, col) for visual collision checks at intersections.
// Both row and col range from 0..lane.length for a square grid of intersections.
export interface Coord {
  row: number; // 0..length
  col: number; // 0..length
}

export const PLAYERS: Player[] = ['Light', 'Dark'];

