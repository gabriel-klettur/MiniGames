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
  enableKillers: false,
  enableHistory: false,
  enablePVS: false,
  enableAspiration: false,
  aspirationDelta: 25,
  prevScore: 0,
  enableQuiescence: false,
  quiescenceDepth: 3,
  quiescenceHighTowerThreshold: 5,
  enableLMR: false,
  lmrMinDepth: 3,
  lmrLateMoveIdx: 4,
  lmrReduction: 1,
};
