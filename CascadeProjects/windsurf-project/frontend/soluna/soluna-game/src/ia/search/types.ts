import type { AIMove } from '../moves';
import type { GameState } from '../../game/types';

/**
 * Search module types.
 *
 * These types describe configuration, runtime stats, results and
 * the per-search shared context used by heuristics like Killers and History.
 */
export type Player = 1 | 2;

/**
 * SearchOptions — Configura las características del motor de búsqueda (engine).
 *
 * Opciones soportadas:
 * - Transposition Table (TT)
 * - Fail-soft windows
 * - Hash move preference
 * - Killers & History heuristics
 * - Principal Variation Search (PVS)
 * - Aspiration windows
 * - Quiescence search (extensiones tácticas)
 * - Late Move Reductions (LMR)
 */
export interface SearchOptions {
  /** Habilitar Transposition Table (TT). */
  enableTT?: boolean;
  /** Actualizar alfa/beta con puntajes exactos del hijo (fail-soft). */
  failSoft?: boolean;
  /** Preferir el movimiento sugerido por TT (hash move). */
  preferHashMove?: boolean;
  /** Habilitar Killer heuristic (guardar 2 mejores cortes por ply). */
  enableKillers?: boolean;
  /** Habilitar History heuristic (bonus a movimientos que cortan). */
  enableHistory?: boolean;
  /** Habilitar PVS (null-window en movimientos no principales). */
  enablePVS?: boolean;
  /** Habilitar ventana de aspiración (aspiration window). */
  enableAspiration?: boolean;
  /** Semiamplitud de la ventana de aspiración respecto a prevScore. */
  aspirationDelta?: number; // window half-size around prev score
  /** Puntuación previa de la iteración anterior (para aspiración). */
  prevScore?: number; // previous iteration score (for aspiration)

  // Quiescence Search: extiende hojas sólo en movimientos tácticos
  /** Habilitar quiescence search. */
  enableQuiescence?: boolean;
  /** Profundidad máxima (plies) en quiescence. */
  quiescenceDepth?: number; // max plies in quiescence
  /** Umbral de altura para considerar un merge como táctico. */
  quiescenceHighTowerThreshold?: number; // consider merges creating >= height as tactical

  // Late Move Reductions (LMR)
  /** Habilitar LMR (reducir profundidad en movimientos tardíos y no tácticos). */
  enableLMR?: boolean;
  /** Aplicar LMR sólo si profundidad >= este valor. */
  lmrMinDepth?: number;      // apply only at depth >= this
  /** Reducir movimientos con índice >= (0-based). */
  lmrLateMoveIdx?: number;   // apply to moves with index >= this (0-based)
  /** Plies a reducir (típicamente 1). */
  lmrReduction?: number;     // plies to reduce (typically 1)

  // Futility pruning (cerca de la hoja, descarta movimientos incapaces de superar alpha/beta)
  /** Habilitar futility pruning en profundidad baja. */
  enableFutility?: boolean;
  /** Margen de futilidad para el score estático. */
  futilityMargin?: number;

  // Late Move Pruning (LMP): descarta movimientos muy tardíos en profundidad baja
  /** Habilitar LMP (pruning de movimientos tardíos no tácticos ni killers). */
  enableLMP?: boolean;
  /** Profundidad máxima para aplicar LMP (p.ej., <= 2). */
  lmpDepthThreshold?: number;
  /** Índice desde el cual considerar "late moves" para LMP. */
  lmpLateMoveIdx?: number;

  // Null-move pruning (pase virtual para detectar fail-high rápido)
  /** Habilitar null-move pruning. */
  enableNullMove?: boolean;
  /** Reducción de profundidad para null-move (típicamente 2). */
  nullMoveReduction?: number;
  /** Profundidad mínima para aplicar null-move. */
  nullMoveMinDepth?: number;
}

/**
 * SearchStats — Métricas de rendimiento de la búsqueda.
 *
 * Campos adicionales son opcionales para mantener compatibilidad.
 */
export interface SearchStats {
  /** Nodos explorados (incluye quiescence). */
  nodes: number;
  /** Probes a la TT. */
  ttProbes?: number;
  /** Hits efectivos de TT (EXACT o cutoff por bound). */
  ttHits?: number;
  /** Cortes alfa/beta realizados. */
  cutoffs?: number;
  /** Re-búsquedas realizadas por PVS al entrar en ventana. */
  pvsReSearches?: number;
  /** Reducciones aplicadas por LMR. */
  lmrReductions?: number;
  /** Prunes aplicados por futility. */
  futilityPrunes?: number;
  /** Prunes aplicados por LMP. */
  lmpPrunes?: number;
  /** Cortes por null-move. */
  nullMovePrunes?: number;
}

/** Resultado de un nodo: valor y principal variation parcial. */
export interface SearchResult { score: number; pv: AIMove[] }

/**
 * Contexto compartido por la búsqueda en un árbol: guarda killers
 * por ply y el mapa de history para puntuar ordenamiento.
 */
export interface SearchContext {
  /** ply -> hasta 2 movimientos (keys) que provocaron corte. */
  killers: Map<number, string[]>; // ply -> [moveKey, ...] (max 2)
  /** `${player}:${moveKey}` -> score acumulado (bonus). */
  history: Map<string, number>;   // `${player}:${moveKey}` -> score
}

/** Agrupación de parámetros de un nodo (conveniente para testing). */
export interface NodeParams {
  state: GameState;
  depth: number;
  alpha: number;
  beta: number;
  me: Player;
  stats?: SearchStats;
  ply: number;
}
