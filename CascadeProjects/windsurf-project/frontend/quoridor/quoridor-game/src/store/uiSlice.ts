import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  darkMode: boolean;
  showDevTools: boolean;
  showRules: boolean;
  showIA: boolean;
  showHistory: boolean;
  showFases: boolean;
  showUX: boolean;
  /** Grosor de las vallas en píxeles (afecta solo a la presentación). */
  wallGap: number;
  /** Deformación del tablero (warp) a un cuadrilátero definido por 4 vértices en % del ancho/alto. */
  boardWarp: {
    enabled: boolean;
    tl: { x: number; y: number }; // top-left
    tr: { x: number; y: number }; // top-right
    br: { x: number; y: number }; // bottom-right
    bl: { x: number; y: number }; // bottom-left
  };
}

const initialState: UIState = {
  darkMode: true,
  showDevTools: false,
  showRules: false,
  showIA: false,
  showHistory: false,
  showFases: true,
  showUX: false,
  wallGap: 8,
  boardWarp: {
    enabled: false,
    tl: { x: 0, y: 0 },
    tr: { x: 100, y: 0 },
    br: { x: 100, y: 100 },
    bl: { x: 0, y: 100 },
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDevTools(state) { state.showDevTools = !state.showDevTools; },
    toggleRules(state) { state.showRules = !state.showRules; },
    toggleIA(state) { state.showIA = !state.showIA; },
    toggleHistory(state) { state.showHistory = !state.showHistory; },
    toggleFases(state) { state.showFases = !state.showFases; },
    toggleUX(state) { state.showUX = !state.showUX; },
    /** Ajusta el grosor de vallas (clamp: 8..32 px). */
    setWallGap(state, action: PayloadAction<number>) {
      let v = Math.round(action.payload);
      if (Number.isNaN(v)) return;
      if (v < 8) v = 8;
      if (v > 32) v = 32;
      state.wallGap = v;
    },
    /** Activa/desactiva la deformación del tablero. */
    toggleBoardWarp(state) { state.boardWarp.enabled = !state.boardWarp.enabled; },
    /** Restaura los vértices a identidad (rectángulo). */
    resetBoardWarp(state) {
      state.boardWarp = {
        enabled: false,
        tl: { x: 0, y: 0 },
        tr: { x: 100, y: 0 },
        br: { x: 100, y: 100 },
        bl: { x: 0, y: 100 },
      };
    },
    /** Ajusta un vértice concreto (x,y en 0..100). */
    setBoardWarpVertex(
      state,
      action: PayloadAction<{ key: 'tl' | 'tr' | 'br' | 'bl'; x?: number; y?: number }>,
    ) {
      const { key, x, y } = action.payload;
      const clamp = (n: number) => (n < 0 ? 0 : n > 100 ? 100 : Math.round(n));
      if (typeof x === 'number') state.boardWarp[key].x = clamp(x);
      if (typeof y === 'number') state.boardWarp[key].y = clamp(y);
    },
  },
});

export const {
  toggleDevTools,
  toggleRules,
  toggleIA,
  toggleHistory,
  toggleFases,
  toggleUX,
  setWallGap,
  toggleBoardWarp,
  resetBoardWarp,
  setBoardWarpVertex,
} = uiSlice.actions;

export default uiSlice.reducer;
