import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TraceConfig, OpeningStrategy } from '../ia/types.ts';

export type TimeMode = 'auto' | 'manual';

export interface RootMoveSummary<M> {
  move: M;
  score: number;
}

export interface IAStats<M> {
  busy: boolean;
  nodes: number;
  elapsedMs: number;
  depthReached: number;
  evalScore: number | null;
  pv: M[];
  rootMoves: Array<RootMoveSummary<M>>;
  /** Distancias más cortas a meta, para el jugador raíz y el oponente, en el estado evaluado. */
  dMe?: number;
  dOp?: number;
}

export type IAPreset = 'balanced' | 'aggressive' | 'defensive' | 'random';

export interface IAConfig {
  enableMoveOrdering: boolean;
  maxWallsRoot: number; // límite de vallas evaluadas en raíz
  maxWallsNode: number; // límite por nodo interno
  enableTT: boolean; // transposition table
  ttSize: number; // tamaño aproximado
  enableIterative: boolean; // profundización iterativa
  enableAlphaBeta: boolean; // activa poda AB (si no, minimax puro)
  randomTieBreak: boolean; // desempate aleatorio entre empates
  hardTimeLimit: boolean; // cortar estrictamente por deadline
  /** Margen de seguridad (segundos) restado al presupuesto antes de fijar el deadline */
  safetyMarginSeconds?: number;
  // Heurística de vallas
  wallMeritLambda?: number; // 0..1 peso para penalizar Δd_me en mérito de valla
  enableWallPathFilter?: boolean; // filtrar vallas por cercanía a ruta mínima del rival
  wallPathRadius?: number; // radio de cercanía (en celdas)
  // Ordenación/optimización avanzada (opcional)
  enableKillerHeuristic?: boolean;
  enableHistoryHeuristic?: boolean;
  enableQuiescence?: boolean;
  quiescenceMaxPlies?: number;
  enableLMR?: boolean;
  enablePVS?: boolean;
  enableAspirationWindows?: boolean;
  aspirationWindow?: number; // tamaño de ventana (p. ej., 0.5)
  // Priorización valla vs movimiento en raíz
  wallVsPawnTauBase?: number; // umbral base de mérito para preferir valla
  reserveWallsMin?: number; // reserva mínima de vallas a conservar
  // Infraestructura
  enableWorker?: boolean; // usar Web Worker para el cálculo de IA
  // Aperturas
  openingStrategy?: OpeningStrategy;
  openingPliesMax?: number;
  // Apertura rápida: limitar presupuesto de tiempo en los primeros plies
  openingFastEnabled?: boolean;
  openingFastPlies?: number; // cuántos plies aplicar el límite rápido (p. ej., 3)
  openingFastSeconds?: number; // presupuesto por jugada rápida (p. ej., 0.8s)
}

export interface IAState<M = any> {
  depth: number; // dificultad 1..10
  timeMode: TimeMode; // solo configurable en IAPanel (DevTools)
  timeSeconds: number; // por defecto 8s (memoria Pylos)
  autoplay: boolean; // autoplay de IA
  /** Motor de IA seleccionado (para tabs del panel Dev). */
  engine?: 'minimax' | 'mcts' | 'hybrid';
  /** Preset de estilo de evaluación/estrategia. */
  preset?: IAPreset;
  /** Preset de dificultad (mapea a profundidad y algunos parámetros). */
  difficultyPreset?: 'novato' | 'intermedio' | 'bueno' | 'fuerte';
  /** Qué bandos están controlados por la IA (para jugar vs IA). */
  control: { L: boolean; D: boolean };
  /** Configuración de trazas para visualización. */
  trace: TraceConfig & { cap: number };
  /** Configuración avanzada (extensibilidad) */
  config: IAConfig;
  /**
   * bySide — Overrides por bando (L/D). Si un campo está definido para un bando,
   * tiene prioridad sobre el global al pensar para ese bando.
   */
  bySide: Record<'L' | 'D', {
    depth?: number;
    timeMode?: TimeMode;
    timeSeconds?: number;
    difficultyPreset?: 'novato' | 'intermedio' | 'bueno' | 'fuerte';
    preset?: IAPreset;
    config?: Partial<IAConfig>;
  }>;
  // Estadísticas/resultados del último cálculo
  stats: IAStats<M>;
  /** Si openingStrategy === 'random', aquí guardamos la apertura elegida por partida. */
  openingResolved?: Exclude<OpeningStrategy, 'random'>;
  /** Si preset === 'random', aquí guardamos el preset elegido por partida. */
  presetResolved?: Exclude<IAPreset, 'random'>;
}

const initialState: IAState = {
  depth: 3,
  timeMode: 'manual',
  timeSeconds: 8,
  autoplay: false,
  engine: 'minimax',
  preset: 'random',
  difficultyPreset: 'intermedio',
  control: { L: false, D: true },
  trace: { enabled: false, sampleRate: 0.25, maxDepth: 4, cap: 5000 },
  config: {
    enableMoveOrdering: true,
    maxWallsRoot: 24,
    maxWallsNode: 12,
    enableTT: true,
    ttSize: 32768,
    enableIterative: true,
    enableAlphaBeta: true,
    randomTieBreak: true,
    hardTimeLimit: true,
    safetyMarginSeconds: 0.15,
    wallMeritLambda: 0.6,
    enableWallPathFilter: true,
    wallPathRadius: 1,
    enableKillerHeuristic: false,
    enableHistoryHeuristic: false,
    enableQuiescence: false,
    quiescenceMaxPlies: 2,
    enableLMR: false,
    enablePVS: true,
    enableAspirationWindows: false,
    aspirationWindow: 0.5,
    wallVsPawnTauBase: 0.75,
    reserveWallsMin: 1,
    enableWorker: true,
    openingStrategy: 'random',
    openingPliesMax: 6,
    openingFastEnabled: true,
    openingFastPlies: 3,
    openingFastSeconds: 0.8,
  },
  bySide: {
    L: {},
    D: {},
  },
  stats: {
    busy: false,
    nodes: 0,
    elapsedMs: 0,
    depthReached: 0,
    evalScore: null,
    pv: [],
    rootMoves: [],
    dMe: 0,
    dOp: 0,
  },
  openingResolved: undefined,
  presetResolved: undefined,
};

const iaSlice = createSlice({
  name: 'ia',
  initialState,
  reducers: {
    setEngine(state, action: PayloadAction<'minimax' | 'mcts' | 'hybrid'>) {
      state.engine = action.payload;
    },
    setPreset(state, action: PayloadAction<IAPreset>) {
      state.preset = action.payload;
      // Al seleccionar 'random' no mutamos la config; se resolverá por partida
      const p = action.payload;
      if (p === 'random') {
        state.presetResolved = undefined;
        return;
      }
      // Aplicar preset concreto sobre config existente
      if (p === 'balanced') {
        state.config.wallMeritLambda = 0.6;
        state.config.enableWallPathFilter = true;
        state.config.wallPathRadius = 1;
        state.config.maxWallsRoot = 24;
        state.config.maxWallsNode = 12;
        state.config.wallVsPawnTauBase = 0.75;
        state.config.reserveWallsMin = 1;
        state.config.enablePVS = true;
        state.config.enableLMR = true;
      } else if (p === 'aggressive') {
        state.config.wallMeritLambda = 0.4;
        state.config.enableWallPathFilter = true;
        state.config.wallPathRadius = 1;
        state.config.maxWallsRoot = 20;
        state.config.maxWallsNode = 10;
        state.config.wallVsPawnTauBase = 0.6;
        state.config.reserveWallsMin = 0;
        state.config.enablePVS = true;
        state.config.enableLMR = true;
      } else if (p === 'defensive') {
        state.config.wallMeritLambda = 0.8;
        state.config.enableWallPathFilter = true;
        state.config.wallPathRadius = 2;
        state.config.maxWallsRoot = 28;
        state.config.maxWallsNode = 14;
        state.config.wallVsPawnTauBase = 1.0;
        state.config.reserveWallsMin = 2;
        state.config.enablePVS = true;
        state.config.enableLMR = true;
      }
    },
    /**
     * Selección de preset de dificultad (Novato, Intermedio, Bueno, Fuerte).
     * Ajusta profundidad y algunos parámetros por defecto pensados para cada nivel.
     */
    setDifficultyPreset(state, action: PayloadAction<'novato' | 'intermedio' | 'bueno' | 'fuerte'>) {
      state.difficultyPreset = action.payload;
      const p = action.payload;
      if (p === 'novato') {
        state.depth = 2;
        // Config menos agresiva y más rápida
        state.config.maxWallsRoot = 16;
        state.config.maxWallsNode = 8;
        state.config.enableIterative = true;
        state.config.enableLMR = false;
        state.config.enablePVS = true;
        state.config.ttSize = 16384;
      } else if (p === 'intermedio') {
        state.depth = 4;
        state.config.maxWallsRoot = 20;
        state.config.maxWallsNode = 10;
        state.config.enableIterative = true;
        state.config.enableLMR = false;
        state.config.enablePVS = true;
        state.config.ttSize = 32768;
      } else if (p === 'bueno') {
        state.depth = 6;
        state.config.maxWallsRoot = 24;
        state.config.maxWallsNode = 12;
        state.config.enableIterative = true;
        state.config.enableLMR = true;
        state.config.enablePVS = true;
        state.config.ttSize = 49152;
      } else if (p === 'fuerte') {
        state.depth = 8;
        state.config.maxWallsRoot = 28;
        state.config.maxWallsNode = 14;
        state.config.enableIterative = true;
        state.config.enableLMR = true;
        state.config.enablePVS = true;
        state.config.ttSize = 65536;
      }
    },
    setDepth(state, action: PayloadAction<number>) {
      let d = Math.max(1, Math.min(10, Math.round(action.payload)));
      state.depth = d;
    },
    setTimeMode(state, action: PayloadAction<TimeMode>) {
      state.timeMode = action.payload;
    },
    setTimeSeconds(state, action: PayloadAction<number>) {
      let s = Math.max(0, Math.min(60, Number(action.payload)));
      state.timeSeconds = s;
    },
    toggleAutoplay(state) {
      state.autoplay = !state.autoplay;
    },
    toggleAIForL(state) {
      state.control.L = !state.control.L;
    },
    toggleAIForD(state) {
      state.control.D = !state.control.D;
    },
    // --- Overrides por bando ---
    setSideDepth(state, action: PayloadAction<{ side: 'L' | 'D'; value: number | undefined }>) {
      const { side, value } = action.payload;
      state.bySide[side].depth = typeof value === 'number' ? Math.max(1, Math.min(10, Math.round(value))) : undefined;
    },
    setSideTimeMode(state, action: PayloadAction<{ side: 'L' | 'D'; value: TimeMode | undefined }>) {
      const { side, value } = action.payload;
      state.bySide[side].timeMode = value;
    },
    setSideTimeSeconds(state, action: PayloadAction<{ side: 'L' | 'D'; value: number | undefined }>) {
      const { side, value } = action.payload;
      state.bySide[side].timeSeconds = typeof value === 'number' ? Math.max(0, Math.min(60, Number(value))) : undefined;
    },
    setSideDifficultyPreset(state, action: PayloadAction<{ side: 'L' | 'D'; value: 'novato' | 'intermedio' | 'bueno' | 'fuerte' | undefined }>) {
      const { side, value } = action.payload;
      state.bySide[side].difficultyPreset = value;
      // Nota: el mapeo de dificultad → (depth, config) se aplicará en tiempo de uso (useAI)
      // para no mutar la config global al configurar un bando.
    },
    setSidePreset(state, action: PayloadAction<{ side: 'L' | 'D'; value: IAPreset | undefined }>) {
      const { side, value } = action.payload;
      state.bySide[side].preset = value;
      // Si value === 'random', la resolución se hará por partida en runtime, igual que global.
    },
    setSideOpeningStrategy(state, action: PayloadAction<{ side: 'L' | 'D'; value: OpeningStrategy | undefined }>) {
      const { side, value } = action.payload;
      state.bySide[side].config = { ...(state.bySide[side].config ?? {}), openingStrategy: value };
    },
    setSideOpeningPliesMax(state, action: PayloadAction<{ side: 'L' | 'D'; value: number | undefined }>) {
      const { side, value } = action.payload;
      const v = typeof value === 'number' ? Math.max(0, Math.round(value)) : undefined;
      state.bySide[side].config = { ...(state.bySide[side].config ?? {}), openingPliesMax: v };
    },
    setSideOpeningFastEnabled(state, action: PayloadAction<{ side: 'L' | 'D'; value: boolean | undefined }>) {
      const { side, value } = action.payload;
      state.bySide[side].config = { ...(state.bySide[side].config ?? {}), openingFastEnabled: !!value };
    },
    setSideOpeningFastPlies(state, action: PayloadAction<{ side: 'L' | 'D'; value: number | undefined }>) {
      const { side, value } = action.payload;
      const v = typeof value === 'number' ? Math.max(0, Math.round(value)) : undefined;
      state.bySide[side].config = { ...(state.bySide[side].config ?? {}), openingFastPlies: v };
    },
    setSideOpeningFastSeconds(state, action: PayloadAction<{ side: 'L' | 'D'; value: number | undefined }>) {
      const { side, value } = action.payload;
      const v = typeof value === 'number' ? Math.max(0, Number(value)) : undefined;
      state.bySide[side].config = { ...(state.bySide[side].config ?? {}), openingFastSeconds: v };
    },
    clearSideOverrides(state, action: PayloadAction<'L' | 'D'>) {
      const side = action.payload;
      state.bySide[side] = {};
    },
    setEnableMoveOrdering(state, action: PayloadAction<boolean>) { state.config.enableMoveOrdering = action.payload; },
    setMaxWallsRoot(state, action: PayloadAction<number>) { state.config.maxWallsRoot = Math.max(0, Math.round(action.payload)); },
    setMaxWallsNode(state, action: PayloadAction<number>) { state.config.maxWallsNode = Math.max(0, Math.round(action.payload)); },
    setEnableTT(state, action: PayloadAction<boolean>) { state.config.enableTT = action.payload; },
    setTTSize(state, action: PayloadAction<number>) { state.config.ttSize = Math.max(0, Math.round(action.payload)); },
    setEnableIterative(state, action: PayloadAction<boolean>) { state.config.enableIterative = action.payload; },
    setEnableAlphaBeta(state, action: PayloadAction<boolean>) { state.config.enableAlphaBeta = action.payload; },
    setRandomTieBreak(state, action: PayloadAction<boolean>) { state.config.randomTieBreak = action.payload; },
    setHardTimeLimit(state, action: PayloadAction<boolean>) { state.config.hardTimeLimit = action.payload; },
    setSafetyMarginSeconds(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      if (typeof v === 'number') {
        state.config.safetyMarginSeconds = Math.max(0, Math.min(5, Number(v)));
      } else {
        state.config.safetyMarginSeconds = undefined;
      }
    },
    // Avanzado: heurísticas/optimizaciones
    setEnableKillerHeuristic(state, action: PayloadAction<boolean | undefined>) {
      state.config.enableKillerHeuristic = !!action.payload;
    },
    setEnableHistoryHeuristic(state, action: PayloadAction<boolean | undefined>) {
      state.config.enableHistoryHeuristic = !!action.payload;
    },
    setEnableQuiescence(state, action: PayloadAction<boolean | undefined>) {
      state.config.enableQuiescence = !!action.payload;
    },
    setQuiescenceMaxPlies(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      state.config.quiescenceMaxPlies = typeof v === 'number' ? Math.max(0, Math.round(v)) : undefined;
    },
    setEnableLMR(state, action: PayloadAction<boolean | undefined>) {
      state.config.enableLMR = !!action.payload;
    },
    setEnablePVS(state, action: PayloadAction<boolean | undefined>) {
      state.config.enablePVS = !!action.payload;
    },
    setEnableAspirationWindows(state, action: PayloadAction<boolean | undefined>) {
      state.config.enableAspirationWindows = !!action.payload;
    },
    setAspirationWindow(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      state.config.aspirationWindow = typeof v === 'number' ? Math.max(0, Number(v)) : undefined;
    },
    setWallVsPawnTauBase(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      state.config.wallVsPawnTauBase = typeof v === 'number' ? Number(v) : undefined;
    },
    setReserveWallsMin(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      state.config.reserveWallsMin = typeof v === 'number' ? Math.max(0, Math.round(v)) : undefined;
    },
    setEnableWorker(state, action: PayloadAction<boolean | undefined>) {
      state.config.enableWorker = !!action.payload;
    },
    // Aperturas
    setOpeningStrategy(state, action: PayloadAction<OpeningStrategy | undefined>) {
      state.config.openingStrategy = action.payload;
    },
    setOpeningPliesMax(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      state.config.openingPliesMax = typeof v === 'number' ? Math.max(0, Math.round(v)) : undefined;
    },
    setOpeningFastEnabled(state, action: PayloadAction<boolean | undefined>) {
      state.config.openingFastEnabled = !!action.payload;
    },
    setOpeningFastPlies(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      state.config.openingFastPlies = typeof v === 'number' ? Math.max(0, Math.round(v)) : undefined;
    },
    setOpeningFastSeconds(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      state.config.openingFastSeconds = typeof v === 'number' ? Math.max(0, Number(v)) : undefined;
    },
    setWallMeritLambda(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      if (typeof v === 'number') {
        state.config.wallMeritLambda = Math.max(0, Math.min(1, v));
      } else {
        state.config.wallMeritLambda = undefined;
      }
    },
    setEnableWallPathFilter(state, action: PayloadAction<boolean | undefined>) {
      state.config.enableWallPathFilter = action.payload ?? false;
    },
    setWallPathRadius(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      if (typeof v === 'number') {
        state.config.wallPathRadius = Math.max(0, Math.round(v));
      } else {
        state.config.wallPathRadius = undefined;
      }
    },
    setBusy(state, action: PayloadAction<boolean>) {
      state.stats.busy = action.payload;
    },
    setStats<M>(state: IAState<M>, action: PayloadAction<Partial<IAStats<M>>>) {
      state.stats = { ...state.stats, ...(action.payload as any) };
    },
    setOpeningResolved(state, action: PayloadAction<Exclude<OpeningStrategy, 'random'> | undefined>) {
      state.openingResolved = action.payload;
    },
    setPresetResolved(state, action: PayloadAction<Exclude<IAPreset, 'random'> | undefined>) {
      state.presetResolved = action.payload;
    },
    resetStats(state) {
      state.stats = initialState.stats;
    },
    resetConfigToDefaults(state) {
      state.config = { ...initialState.config } as any;
    },
    // --- Trace configuration ---
    setTraceEnabled(state, action: PayloadAction<boolean>) {
      state.trace.enabled = !!action.payload;
    },
    setTraceSampleRate(state, action: PayloadAction<number>) {
      const v = Number(action.payload);
      state.trace.sampleRate = Math.max(0, Math.min(1, isFinite(v) ? v : 0));
    },
    setTraceMaxDepth(state, action: PayloadAction<number | undefined>) {
      const v = action.payload;
      state.trace.maxDepth = typeof v === 'number' ? Math.max(0, Math.round(v)) : undefined;
    },
    setTraceCap(state, action: PayloadAction<number>) {
      const v = Math.max(100, Math.round(Number(action.payload)));
      state.trace.cap = v;
    },
  },
});

export const {
  setEngine,
  setPreset,
  setDifficultyPreset,
  setDepth,
  setTimeMode,
  setTimeSeconds,
  toggleAutoplay,
  toggleAIForL,
  toggleAIForD,
  setSideDepth,
  setSideTimeMode,
  setSideTimeSeconds,
  setSideDifficultyPreset,
  setSidePreset,
  setSideOpeningStrategy,
  setSideOpeningPliesMax,
  setSideOpeningFastEnabled,
  setSideOpeningFastPlies,
  setSideOpeningFastSeconds,
  clearSideOverrides,
  setEnableMoveOrdering,
  setMaxWallsRoot,
  setMaxWallsNode,
  setEnableTT,
  setTTSize,
  setEnableIterative,
  setEnableAlphaBeta,
  setRandomTieBreak,
  setHardTimeLimit,
  setSafetyMarginSeconds,
  setWallMeritLambda,
  setEnableWallPathFilter,
  setWallPathRadius,
  setEnableKillerHeuristic,
  setEnableHistoryHeuristic,
  setEnableQuiescence,
  setQuiescenceMaxPlies,
  setEnableLMR,
  setEnablePVS,
  setEnableAspirationWindows,
  setAspirationWindow,
  setWallVsPawnTauBase,
  setReserveWallsMin,
  setEnableWorker,
  setOpeningStrategy,
  setOpeningPliesMax,
  setOpeningFastEnabled,
  setOpeningFastPlies,
  setOpeningFastSeconds,
  setBusy,
  setStats,
  resetStats,
  resetConfigToDefaults,
  setTraceEnabled,
  setTraceSampleRate,
  setTraceMaxDepth,
  setTraceCap,
  setOpeningResolved,
  setPresetResolved,
} = iaSlice.actions;

export default iaSlice.reducer;
