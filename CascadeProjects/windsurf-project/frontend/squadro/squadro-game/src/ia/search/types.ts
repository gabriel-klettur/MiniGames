import type { GameState, Player } from '../../game/types';

export interface SearchStats {
  nodes: number;
  ttProbes?: number;
  ttHits?: number;
  cutoffs?: number;
  pvsReSearches?: number;
  lmrReductions?: number;
  // Number of re-searches triggered by Aspiration Windows adjustments
  aspReSearches?: number;
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
  // Small random jitter added to move ordering priority (breaks deterministic ties).
  // Typical values: 0 (disabled), 0.5 .. 2.0 (very light), 5.0+ (aggressive randomness)
  orderingJitterEps?: number;
  // Aspiration Windows
  enableAspiration?: boolean; // use aspiration windows around last score
  aspDelta?: number;          // initial half-window size around the previous score
  // Quiescence Search (limited to tactical moves)
  enableQuiescence?: boolean;
  quiescenceMaxPlies?: number; // safety cap for quiescence extensions
  // Adaptive time control
  enableAdaptiveTime?: boolean; // break before next iteration if time is likely insufficient
  timeSlackMs?: number;         // reserved slack to avoid overruns (e.g., 50ms)
  // Root parallelization (main thread orchestrator)
  enableRootParallel?: boolean;
  workers?: number;             // desired workers for root parallelization
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
  // Optional hook to report progress (nodes) periodically from deep inside the search
  progressHook?: (nodes: number) => void;
}

export interface IterResult {
  score: number;
  bestMove: string | null;
  timeout: boolean;
}
