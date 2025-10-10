import type { GameState, Player } from '../../game/types';

export interface SearchStats {
  nodes: number;
  ttProbes?: number;
  ttHits?: number;
  cutoffs?: number;
  pvsReSearches?: number;
  lmrReductions?: number;
}

export interface SearchContext {
  killers: Map<number, string[]>; // ply -> top-2 killer moveIds
  history: Map<string, number>;   // `${player}:${moveId}` -> score
}

export interface EngineOptions {
  enableTT?: boolean;
  enableKillers?: boolean;
  enableHistory?: boolean;
  // Principal Variation Search (PVS)
  enablePVS?: boolean;
  // Late Move Reductions (LMR)
  enableLMR?: boolean;
  lmrMinDepth?: number;    // apply only when depth >= this
  lmrLateMoveIdx?: number; // apply to moves with index >= this
  lmrReduction?: number;   // plies to reduce
  // Prefer TT bestMove as hash move in ordering
  preferHashMove?: boolean;
}

export interface NodeParams {
  state: GameState;
  depth: number;
  alpha: number;
  beta: number;
  me: Player;      // root perspective
  ply: number;     // root=0
  stats?: SearchStats;
  allowedRootMoves?: Set<string>;
  isRoot?: boolean;
}

export interface IterResult {
  score: number;
  bestMove: string | null;
  timeout: boolean;
}
