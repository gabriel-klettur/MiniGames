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
}

export interface IAState<M = any> {
  depth: number; // dificultad 1..10
  timeMode: TimeMode; // solo configurable en IAPanel (DevTools)
  timeSeconds: number; // por defecto 8s (memoria Pylos)
  autoplay: boolean; // autoplay de IA
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
  };
  // Estadísticas/resultados del último cálculo
  stats: IAStats<M>;
}

const initialState: IAState = {
  depth: 3,
  timeMode: 'manual',
  timeSeconds: 8,
  autoplay: false,
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
  },
  stats: {
    busy: false,
    nodes: 0,
    elapsedMs: 0,
    depthReached: 0,
    evalScore: null,
    pv: [],
    rootMoves: [],
  },
};

const iaSlice = createSlice({
  name: 'ia',
  initialState,
  reducers: {
    setDepth(state, action: PayloadAction<number>) {
      let d = Math.max(1, Math.min(10, Math.round(action.payload)));
      state.depth = d;
    },
    setTimeMode(state, action: PayloadAction<TimeMode>) {
      state.timeMode = action.payload;
    },
    setTimeSeconds(state, action: PayloadAction<number>) {
      let s = Math.max(0, Math.min(30, Number(action.payload)));
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
    setBusy(state, action: PayloadAction<boolean>) {
      state.stats.busy = action.payload;
    },
    setStats<M>(state: IAState<M>, action: PayloadAction<Partial<IAStats<M>>>) {
      state.stats = { ...state.stats, ...(action.payload as any) };
    },
    resetStats(state) {
      state.stats = initialState.stats;
    },
  },
});

export const {
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
  setBusy,
  setStats,
  resetStats,
} = iaSlice.actions;

export default iaSlice.reducer;
