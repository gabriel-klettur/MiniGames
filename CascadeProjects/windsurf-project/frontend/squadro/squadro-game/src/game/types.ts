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
  // UI configuration (visual only; does not affect rules)
  ui: UISettings;
  // Optional AI configuration (does not affect rules directly)
  ai?: AISettings;
}

// Board grid coordinate (row, col) for visual collision checks at intersections.
// Both row and col range from 0..lane.length for a square grid of intersections.
export interface Coord {
  row: number; // 0..length
  col: number; // 0..length
}

export const PLAYERS: Player[] = ['Light', 'Dark'];

// Visual/UI settings not tied to game rules
export type Orientation = 'classic' | 'bga';
export interface UISettings {
  pieceWidth: number; // px width of the prism-shaped piece
  pieceHeight: number; // px height of the prism-shaped piece
  orientation: Orientation; // board rendering orientation
}

// AI configuration for vs AI games
export type AISpeed = 'auto' | 'rapido' | 'normal' | 'lento';
export interface AISettings {
  enabled: boolean;          // if true, game is vs AI
  aiSide: Player;            // which side AI plays
  difficulty: number;        // 1..10
  speed: AISpeed;            // UI label; maps to time budget
  timeMode: 'auto' | 'manual';
  timeSeconds: number;       // when manual, budget per move
  busy?: boolean;            // ephemeral: IA pensando
  // --- Instrumentation (ephemeral, not persisted) ---
  nodesVisited?: number;     // nodes searched in current/last search
  startedAt?: number;        // timestamp when current search started (ms)
  lastDurationMs?: number;   // duration of the last completed search
  depthReached?: number;     // max depth reached in iterative deepening
  lastScore?: number;        // score of best move at last iter
}

// Centralized starting player to ensure deterministic game start
export const STARTING_PLAYER: Player = 'Light';

