import type { SearchOptions } from './types';

/**
 * defaultOptions — Valores por defecto del motor de búsqueda.
 *
 * Los flags activan/desactivan heurísticas y extensiones de búsqueda.
 * Se pueden sobreescribir por llamada en `bestMove(..., options)`.
 */
export const defaultOptions: Required<SearchOptions> = {
  enableTT: true,
  failSoft: true,
  preferHashMove: true,
  enableKillers: true,
  enableHistory: true,
  enablePVS: true,
  enableAspiration: true,
  aspirationDelta: 35,
  prevScore: 0,
  enableQuiescence: true,
  quiescenceDepth: 3,
  quiescenceHighTowerThreshold: 5,
  enableLMR: true,
  lmrMinDepth: 3,
  lmrLateMoveIdx: 4,
  lmrReduction: 1,
  enableFutility: true,
  futilityMargin: 50,
  enableLMP: true,
  lmpDepthThreshold: 2,
  lmpLateMoveIdx: 6,
  enableNullMove: true,
  nullMoveReduction: 2,
  nullMoveMinDepth: 3,
};
