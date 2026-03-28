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
  // Aspiration off por estabilidad (evita re-búsquedas por ventanas estrechas)
  enableAspiration: false,
  aspirationDelta: 20,
  prevScore: 0,
  enableQuiescence: true,
  quiescenceDepth: 3,
  // Umbral más bajo para considerar más jugadas "tácticas" en qsearch
  quiescenceHighTowerThreshold: 4,
  enableLMR: true,
  lmrMinDepth: 3,
  lmrLateMoveIdx: 4,
  lmrReduction: 1,
  // Futility y LMP deshabilitados por defecto: la escala de evaluación es baja
  enableFutility: false,
  futilityMargin: 10,
  enableLMP: false,
  lmpDepthThreshold: 0,
  lmpLateMoveIdx: 6,
  // Null-move pruning off para evitar errores en zugzwang/fin de ronda
  enableNullMove: false,
  nullMoveReduction: 2,
  nullMoveMinDepth: 3,
};

// Preset público: actualmente igual a defaultOptions (copia por valor) para uso en Simulación/InfoIA.
export const IAPOWA_PRESET: Required<SearchOptions> = { ...defaultOptions };

// Preset de Rendimiento: activa heurísticas más agresivas para mayor velocidad
// y profundidad efectiva a costa de potencial inestabilidad en zugzwang.
export const IAPOWA_PERFORMANCE_PRESET: Required<SearchOptions> = {
  ...defaultOptions,
  enableAspiration: true,
  aspirationDelta: 25,
  enableFutility: true,
  futilityMargin: 30,
  enableLMP: true,
  lmpDepthThreshold: 2,
  enableNullMove: true,
  nullMoveReduction: 2,
  nullMoveMinDepth: 3,
};

// Preset de Defensa: maximiza estabilidad y minimiza riesgos de poda en zugzwang/fin de ronda.
// Extiende más en hojas y reduce LMR agresivo.
export const IAPOWA_DEFENSE_PRESET: Required<SearchOptions> = {
  ...defaultOptions,
  enableAspiration: false,
  enableFutility: false,
  enableLMP: false,
  enableNullMove: false,
  quiescenceDepth: 4,
  quiescenceHighTowerThreshold: 3,
  lmrMinDepth: 4,
  lmrReduction: 1,
};
