import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

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

export interface IAState<M = any> {
  depth: number; // dificultad 1..10
  timeMode: TimeMode; // solo configurable en IAPanel (DevTools)
  timeSeconds: number; // por defecto 8s (memoria Pylos)
  autoplay: boolean; // autoplay de IA
  /** Motor de IA seleccionado (para tabs del panel Dev). */
  engine?: 'minimax' | 'mcts' | 'hybrid';
  /** Preset de estilo de evaluación/estrategia. */
  preset?: 'balanced' | 'aggressive' | 'defensive';
  /** Qué bandos están controlados por la IA (para jugar vs IA). */
  control: { L: boolean; D: boolean };
  /** Configuración avanzada (extensibilidad) */
  config: {
    enableMoveOrdering: boolean;
    maxWallsRoot: number; // límite de vallas evaluadas en raíz
    maxWallsNode: number; // límite por nodo interno
    enableTT: boolean; // transposition table
    ttSize: number; // tamaño aproximado
    enableIterative: boolean; // profundización iterativa
    enableAlphaBeta: boolean; // activa poda AB (si no, minimax puro)
    randomTieBreak: boolean; // desempate aleatorio entre empates
    hardTimeLimit: boolean; // cortar estrictamente por deadline
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
  };
  // Estadísticas/resultados del último cálculo
  stats: IAStats<M>;
}

const initialState: IAState = {
  depth: 3,
  timeMode: 'manual',
  timeSeconds: 8,
  autoplay: false,
  engine: 'minimax',
  preset: 'balanced',
  control: { L: false, D: true },
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
};

const iaSlice = createSlice({
  name: 'ia',
  initialState,
  reducers: {
    setEngine(state, action: PayloadAction<'minimax' | 'mcts' | 'hybrid'>) {
      state.engine = action.payload;
    },
    setPreset(state, action: PayloadAction<'balanced' | 'aggressive' | 'defensive'>) {
      state.preset = action.payload;
      // Aplicar preset sobre config existente
      const p = action.payload;
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
    setEnableMoveOrdering(state, action: PayloadAction<boolean>) { state.config.enableMoveOrdering = action.payload; },
    setMaxWallsRoot(state, action: PayloadAction<number>) { state.config.maxWallsRoot = Math.max(0, Math.round(action.payload)); },
    setMaxWallsNode(state, action: PayloadAction<number>) { state.config.maxWallsNode = Math.max(0, Math.round(action.payload)); },
    setEnableTT(state, action: PayloadAction<boolean>) { state.config.enableTT = action.payload; },
    setTTSize(state, action: PayloadAction<number>) { state.config.ttSize = Math.max(0, Math.round(action.payload)); },
    setEnableIterative(state, action: PayloadAction<boolean>) { state.config.enableIterative = action.payload; },
    setEnableAlphaBeta(state, action: PayloadAction<boolean>) { state.config.enableAlphaBeta = action.payload; },
    setRandomTieBreak(state, action: PayloadAction<boolean>) { state.config.randomTieBreak = action.payload; },
    setHardTimeLimit(state, action: PayloadAction<boolean>) { state.config.hardTimeLimit = action.payload; },
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
    resetStats(state) {
      state.stats = initialState.stats;
    },
    resetConfigToDefaults(state) {
      state.config = { ...initialState.config } as any;
    },
  },
});

export const {
  setEngine,
  setPreset,
  setDepth,
  setTimeMode,
  setTimeSeconds,
  toggleAutoplay,
  toggleAIForL,
  toggleAIForD,
  setEnableMoveOrdering,
  setMaxWallsRoot,
  setMaxWallsNode,
  setEnableTT,
  setTTSize,
  setEnableIterative,
  setEnableAlphaBeta,
  setRandomTieBreak,
  setHardTimeLimit,
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
  setBusy,
  setStats,
  resetStats,
  resetConfigToDefaults,
} = iaSlice.actions;

export default iaSlice.reducer;
