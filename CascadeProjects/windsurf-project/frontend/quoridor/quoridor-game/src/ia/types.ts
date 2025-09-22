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
  /** Peso λ para penalizar aumentar nuestra distancia al evaluar vallas. 0..1 */
  wallMeritLambda?: number;
  /** Si true, pre-filtra vallas candidatas cerca de la ruta mínima del oponente. */
  enableWallPathFilter?: boolean;
  /** Radio (en celdas) para seleccionar vallas cerca de la ruta del oponente. */
  wallPathRadius?: number;
  /** Heurística/orden avanzado (a implementar): */
  enableKillerHeuristic?: boolean;
  enableHistoryHeuristic?: boolean;
  enableQuiescence?: boolean;
  quiescenceMaxPlies?: number;
  enableLMR?: boolean;
  enablePVS?: boolean;
  enableAspirationWindows?: boolean;
  aspirationWindow?: number; // tamaño de ventana (p. ej., 0.5)
  /** Priorización valla vs movimiento en raíz: umbral base τ y reserva mínima de vallas. */
  wallVsPawnTauBase?: number;
  reserveWallsMin?: number;
}
