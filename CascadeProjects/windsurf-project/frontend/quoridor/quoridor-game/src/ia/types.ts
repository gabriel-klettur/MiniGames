import type { Coord, Wall } from '../game/types.ts';

// Move types for Quoridor AI
export type PawnMove = {
  kind: 'pawn';
  to: Coord;
};

export type WallMove = {
  kind: 'wall';
  wall: Wall;
};

export type AIMove = PawnMove | WallMove;

export interface SearchParams {
  maxDepth: number; // 1..10
  deadlineMs?: number; // Date.now() deadline for time control (optional)
  config?: SearchConfig;
}

export interface SearchResult {
  best: AIMove | null;
  score: number; // evaluation from root player's perspective
  depthReached: number;
  nodes: number;
  elapsedMs: number;
  pv: AIMove[]; // principal variation (best line)
  rootMoves: Array<{ move: AIMove; score: number }>; // scores at root
}

export interface SearchConfig {
  enableMoveOrdering: boolean;
  maxWallsRoot: number;
  maxWallsNode: number;
  enableTT: boolean;
  ttSize: number;
  enableIterative: boolean;
  enableAlphaBeta: boolean;
  randomTieBreak: boolean;
  hardTimeLimit: boolean;
}
