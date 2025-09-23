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

// Opening strategies supported by the AI
export type OpeningStrategy =
  | 'racing'            // Apertura de Carrera
  | 'defensive'         // Apertura Defensiva
  | 'central_control'   // Apertura de Control Central
  | 'mirror'            // Apertura Espejo
  | 'early_block';      // Apertura de “Muro Rápido”

export interface SearchParams {
  maxDepth: number; // 1..10
  deadlineMs?: number; // Date.now() deadline for time control (optional)
  config?: SearchConfig;
  /** Optional callback to receive trace events during search (non-worker mode). */
  onTrace?: (ev: TraceEvent | TraceEvent[]) => void;
  /** Optional trace configuration to control verbosity and sampling. */
  traceConfig?: TraceConfig;
  /** Cooperative-cancel predicate; when returns true, search should stop ASAP. */
  shouldStop?: () => boolean;
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
  /** Estrategia de apertura seleccionada. */
  openingStrategy?: OpeningStrategy;
  /** Hasta cuántos plies se considera la fase de apertura (aprox). */
  openingPliesMax?: number;
}

// --- Tracing model ---
export type TraceConfig = {
  enabled: boolean;
  /** 0..1 probability of keeping an event (sampling). */
  sampleRate: number;
  /** Optional maximum depth to trace (inclusive). */
  maxDepth?: number;
};

export type TraceBase = {
  t: number; // performance.now()
  depth: number; // remaining depth in the AB call
  ply: number; // ply from root
  nodeId: number; // unique id per node
  parentId?: number;
};

export type TraceNodeEnter = TraceBase & {
  type: 'node_enter';
  alpha: number;
  beta: number;
  maximizing: boolean;
};

export type TraceNodeExit = TraceBase & {
  type: 'node_exit';
  score: number;
  bestMove?: AIMove;
};

export type TraceEval = TraceBase & {
  type: 'eval';
  score: number;
};

export type TraceCutoff = TraceBase & {
  type: 'cutoff';
  reason: 'alpha' | 'beta';
  move?: AIMove;
  alpha: number;
  beta: number;
};

export type TraceTTHit = TraceBase & {
  type: 'tt_hit';
};

export type TraceBestUpdate = TraceBase & {
  type: 'best_update';
  move: AIMove;
  score: number;
};

export type TraceIterStart = {
  type: 'iter_start';
  t: number;
  depth: number; // current iterative depth
};

export type TraceIterEnd = {
  type: 'iter_end';
  t: number;
  depth: number;
};

export type TraceEvent =
  | TraceNodeEnter
  | TraceNodeExit
  | TraceEval
  | TraceCutoff
  | TraceTTHit
  | TraceBestUpdate
  | TraceIterStart
  | TraceIterEnd;
