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
  /** Mostrar u ocultar visualmente el hitbox de las vallas (sigue siendo clickeable). */
  showWallHitboxes: boolean;
  /** Color base de los hitboxes de vallas (para presentación). */
  wallHitboxColor: 'purple' | 'cyan' | 'amber' | 'blue' | 'emerald' | 'gray';
  /** Si true, la previsualización usa un solo color (sin verde/rojo por validez). */
  wallPreviewMonochrome: boolean;
  /** Opacidad base del hitbox visible (discreto para Tailwind: 10,20,30,40). */
  wallHitboxOpacity: 10 | 20 | 30 | 40;
  /** Mostrar preview al pasar el ratón cuando los hitbox están ocultos. */
  previewOnHoverWhenHidden: boolean;
  /** Forma del hitbox visual: porcentajes de ancho/alto por orientación (1..500%). */
  wallHitboxShape: {
    H: { widthPct: number; heightPct: number };
    V: { widthPct: number; heightPct: number };
  };
  /** Grosor extra del hitbox en píxeles por orientación (puede ser negativo para estrechar). */
  wallHitboxThicknessPx: {
    H: number;
    V: number;
  };
  /** Si true, el área clickeable se expande con el tamaño configurado del hitbox (beta). */
  expandClickableWithShape: boolean;
  /** Si true, el clic/hover se restringe exactamente al shape del hitbox. */
  restrictClickToHitbox: boolean;
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
  showHistory: false,
  showIA: false,
  showFases: false,
  showUX: false,
  showWallHitboxes: false,
  wallHitboxColor: 'purple',
  wallPreviewMonochrome: false,
  wallHitboxOpacity: 20,
  previewOnHoverWhenHidden: false,
  wallHitboxShape: {
    H: { widthPct: 100, heightPct: 100 },
    V: { widthPct: 100, heightPct: 100 },
  },
  wallHitboxThicknessPx: { H: 0, V: 0 },
  expandClickableWithShape: true,
  restrictClickToHitbox: true,
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
    /** Alterna la visibilidad visual de los hitboxes de vallas. */
    toggleWallHitboxes(state) { state.showWallHitboxes = !state.showWallHitboxes; },
    /** Cambia el color base de hitboxes de vallas. */
    setWallHitboxColor(state, action: PayloadAction<UIState['wallHitboxColor']>) {
      state.wallHitboxColor = action.payload;
    },
    /** Alterna expansión del área clickeable según la forma (beta). */
    toggleExpandClickableWithShape(state) {
      state.expandClickableWithShape = !state.expandClickableWithShape;
    },
    /** Alterna restricción de clics exactamente al shape. */
    toggleRestrictClickToHitbox(state) {
      state.restrictClickToHitbox = !state.restrictClickToHitbox;
    },
    /** Alterna si la previsualización es monocromática. */
    toggleWallPreviewMonochrome(state) {
      state.wallPreviewMonochrome = !state.wallPreviewMonochrome;
    },
    /** Ajusta opacidad del hitbox visible. */
    setWallHitboxOpacity(state, action: PayloadAction<10 | 20 | 30 | 40>) {
      state.wallHitboxOpacity = action.payload;
    },
    /** Alterna preview por hover aunque estén ocultos los hitbox. */
    togglePreviewOnHoverWhenHidden(state) {
      state.previewOnHoverWhenHidden = !state.previewOnHoverWhenHidden;
    },
    /** Ajusta la forma del hitbox visual (porcentajes 1..500). */
    setWallHitboxShape(
      state,
      action: PayloadAction<{ o: 'H' | 'V'; widthPct?: number; heightPct?: number }>,
    ) {
      const { o, widthPct, heightPct } = action.payload;
      const clamp = (n: number) => (n < 1 ? 1 : n > 500 ? 500 : Math.round(n));
      if (typeof widthPct === 'number') state.wallHitboxShape[o].widthPct = clamp(widthPct);
      if (typeof heightPct === 'number') state.wallHitboxShape[o].heightPct = clamp(heightPct);
    },
    /** Ajusta el grosor de vallas (clamp: 8..32 px). */
    setWallGap(state, action: PayloadAction<number>) {
      let v = Math.round(action.payload);
      if (Number.isNaN(v)) return;
      if (v < 8) v = 8;
      if (v > 32) v = 32;
      state.wallGap = v;
    },
    /** Ajusta grosor extra del hitbox en píxeles (clamp: -50..50) por orientación. */
    setWallHitboxThicknessPx(
      state,
      action: PayloadAction<{ o: 'H' | 'V'; px: number }>,
    ) {
      const { o, px } = action.payload;
      let v = Math.round(px);
      if (Number.isNaN(v)) return;
      if (v < -50) v = -50;
      if (v > 50) v = 50;
      state.wallHitboxThicknessPx[o] = v;
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
  toggleWallHitboxes,
  setWallHitboxColor,
  toggleWallPreviewMonochrome,
  setWallHitboxOpacity,
  togglePreviewOnHoverWhenHidden,
  toggleExpandClickableWithShape,
  toggleRestrictClickToHitbox,
  setWallHitboxShape,
  setWallGap,
  setWallHitboxThicknessPx,
  toggleBoardWarp,
  resetBoardWarp,
  setBoardWarpVertex,
} = uiSlice.actions;

export default uiSlice.reducer;
