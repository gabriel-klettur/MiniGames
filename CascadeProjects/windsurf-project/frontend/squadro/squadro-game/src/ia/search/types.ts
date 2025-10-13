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
  futilityPrunes?: number;
  lmpPrunes?: number;
  iidProbes?: number;
  killersTried?: number;
  historyUpdates?: number;
  hashMoveUsed?: number;
  qNodes?: number;
  qPlies?: number;
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
  // Late Move Pruning (LMP)
  enableLMP?: boolean;     // prune very late non-tactical moves at shallow depths
  lmpMaxDepth?: number;    // only apply LMP when depth <= this
  lmpBase?: number;        // base threshold for late move index (threshold = lmpBase + 2*depth)
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
  quiescenceStandPatMargin?: number; // margin subtracted from stand-pat (scaled by phase/depth)
  quiescenceSeeMargin?: number; // SEE-like threshold to expand tactical moves
  quiescenceExtendOnRetire?: boolean; // do not consume qDepth when move retires a piece
  quiescenceExtendOnJump?: boolean;   // do not consume qDepth when move causes immediate send-back
  // Internal Iterative Deepening (IID)
  enableIID?: boolean;      // when no hash move, probe depth-1 to seed ordering
  iidMinDepth?: number;     // only when depth >= this
  // Futility pruning (non-PV, shallow depths, non-tactical)
  enableFutility?: boolean;
  futilityMargin?: number;  // margin per ply to compare against alpha
  // Adaptive time control
  enableAdaptiveTime?: boolean; // break before next iteration if time is likely insufficient
  timeSlackMs?: number;         // reserved slack to avoid overruns (e.g., 50ms)
  adaptiveGrowthFactor?: number;        // base multiplicative growth for next iter cost (e.g., 1.8)
  adaptiveBFWeight?: number;            // extra growth per unit of root branching beyond a baseline
  // Root parallelization (main thread orchestrator)
  enableRootParallel?: boolean;
  workers?: number;             // desired workers for root parallelization
  // Cross-worker PV seeding: first move of a good PV from another worker
  rootPVHint?: string;
  // Cross-worker alpha sharing: global lower bound from sibling workers
  sharedRootAlpha?: number;
  // DF-PN (Proof-Number Search) options for small endgames
  enableDFPN?: boolean;
  dfpnMaxActive?: number;     // trigger when active (non-retired) pieces <= this
  dfpnMaxTurnsLeft?: number;  // optional trigger by total turns-left sum
  // Tablebase probe (fast-path) for known positions
  enableTablebase?: boolean;
  // Repetition/cycle handling
  drawScore?: number;               // score to return on detected repetition (default 0)
  preferDrawWhenLosing?: boolean;   // future use to bias move choice
}

export interface NodeParams {
  state: GameState;
  depth: number;
  alpha: number;
  beta: number;
  me: Player;      // root perspective
  ply: number;     // root=0
  stats?: SearchStats;
  maxNodes?: number;
  allowedRootMoves?: Set<string>;
  pvHintMove?: string;
  isRoot?: boolean;
  // True when running an IID probe to avoid nested IID
  iidProbe?: boolean;
  // Optional hook to report progress (nodes) periodically from deep inside the search
  progressHook?: (nodes: number) => void;
  // Path keys seen in current branch for repetition detection
  path?: Set<string>;
}

export interface IterResult {
  score: number;
  bestMove: string | null;
  timeout: boolean;
}
