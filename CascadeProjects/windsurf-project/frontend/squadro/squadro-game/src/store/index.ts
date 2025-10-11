import { configureStore } from '@reduxjs/toolkit';
import gameReducer, { setPieceHeight, setPieceWidth, setPieceScale, setOrientation, setShowCoordsOverlay, setShowPipIndicators, setCalibrationOverlay, setCalibrationOriginX, setCalibrationOriginY, setCalibrationPitchScaleX, setCalibrationPitchScaleY, setAIEnabled, setAISide, setAIDifficulty, setAIUseWorkers, setAITimeMode, setAITimeSeconds, setShowPieces, setPieceAnimMs, setPieceRotateMs, setPieceHeightLight, setPieceHeightDark, setPieceWidthScaleLight, setPieceWidthScaleDark, setBoardScale } from './gameSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// --- UI & AI persistence (localStorage) ---
const UI_STORAGE_KEY = 'squadro_ui';
const AI_STORAGE_KEY = 'squadro_ai';
type StoredUI = {
  pieceWidth?: number;
  pieceHeight?: number;
  pieceScale?: number;
  // Pieces visibility and animation speed
  showPieces?: boolean;
  pieceAnimMs?: number;
  pieceRotateMs?: number;
  // Per-side piece dimensions
  pieceHeightLight?: number;
  pieceHeightDark?: number;
  pieceWidthScaleLight?: number;
  pieceWidthScaleDark?: number;
  // Board scale
  boardScale?: number;
  orientation?: 'classic' | 'bga';
  showCoordsOverlay?: boolean;
  showPipIndicators?: boolean;
  calibration?: {
    originX?: number;
    originY?: number;
    pitchScaleX?: number;
    pitchScaleY?: number;
    showOverlay?: boolean;
  };
};

function loadStoredUI(): StoredUI | undefined {
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as StoredUI;
  } catch {
    // ignore
  }
  return undefined;
}

function saveStoredUI(ui: StoredUI): void {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(ui));
  } catch {
    // ignore
  }
}

// Hydrate UI from storage on startup
const stored = loadStoredUI();
if (stored) {
  if (typeof stored.pieceWidth === 'number') store.dispatch(setPieceWidth(stored.pieceWidth));
  if (typeof stored.pieceHeight === 'number') store.dispatch(setPieceHeight(stored.pieceHeight));
  if (typeof stored.pieceScale === 'number') store.dispatch(setPieceScale(stored.pieceScale));
  if (typeof stored.showPieces === 'boolean') store.dispatch(setShowPieces(stored.showPieces));
  if (typeof stored.pieceAnimMs === 'number') store.dispatch(setPieceAnimMs(stored.pieceAnimMs));
  if (typeof stored.pieceRotateMs === 'number') store.dispatch(setPieceRotateMs(stored.pieceRotateMs));
  if (typeof stored.pieceHeightLight === 'number') store.dispatch(setPieceHeightLight(stored.pieceHeightLight));
  if (typeof stored.pieceHeightDark === 'number') store.dispatch(setPieceHeightDark(stored.pieceHeightDark));
  if (typeof stored.pieceWidthScaleLight === 'number') store.dispatch(setPieceWidthScaleLight(stored.pieceWidthScaleLight));
  if (typeof stored.pieceWidthScaleDark === 'number') store.dispatch(setPieceWidthScaleDark(stored.pieceWidthScaleDark));
  if (typeof stored.boardScale === 'number') store.dispatch(setBoardScale(stored.boardScale));
  if (stored.orientation === 'classic' || stored.orientation === 'bga') store.dispatch(setOrientation(stored.orientation));
  if (typeof stored.showCoordsOverlay === 'boolean') store.dispatch(setShowCoordsOverlay(stored.showCoordsOverlay));
  if (typeof stored.showPipIndicators === 'boolean') store.dispatch(setShowPipIndicators(stored.showPipIndicators));
  if (stored.calibration && typeof stored.calibration === 'object') {
    const c = stored.calibration;
    if (typeof c.originX === 'number') store.dispatch(setCalibrationOriginX(c.originX));
    if (typeof c.originY === 'number') store.dispatch(setCalibrationOriginY(c.originY));
    if (typeof c.pitchScaleX === 'number') store.dispatch(setCalibrationPitchScaleX(c.pitchScaleX));
    if (typeof c.pitchScaleY === 'number') store.dispatch(setCalibrationPitchScaleY(c.pitchScaleY));
    if (typeof c.showOverlay === 'boolean') store.dispatch(setCalibrationOverlay(c.showOverlay));
  }
}

// Subscribe to store updates to persist UI settings
let lastSaved: StoredUI | undefined;
store.subscribe(() => {
  const state = store.getState() as RootState;
  const ui = state.game.ui;
  const toSave: StoredUI = {
    pieceWidth: ui.pieceWidth,
    pieceHeight: ui.pieceHeight,
    pieceScale: ui.pieceScale,
    showPieces: ui.showPieces,
    pieceAnimMs: ui.pieceAnimMs,
    pieceRotateMs: (ui as any).pieceRotateMs,
    pieceHeightLight: ui.pieceHeightLight,
    pieceHeightDark: ui.pieceHeightDark,
    pieceWidthScaleLight: ui.pieceWidthScaleLight,
    pieceWidthScaleDark: ui.pieceWidthScaleDark,
    boardScale: (ui as any).boardScale,
    orientation: ui.orientation as 'classic' | 'bga',
    showCoordsOverlay: ui.showCoordsOverlay,
    showPipIndicators: ui.showPipIndicators,
    calibration: ui.calibration ? {
      originX: ui.calibration.originX,
      originY: ui.calibration.originY,
      pitchScaleX: (ui.calibration as any).pitchScaleX,
      pitchScaleY: (ui.calibration as any).pitchScaleY,
      showOverlay: ui.calibration.showOverlay,
    } : undefined,
  };
  const changed = JSON.stringify(toSave) !== JSON.stringify(lastSaved);
  if (changed) {
    saveStoredUI(toSave);
    lastSaved = toSave;
  }
});

// --- AI persistence ---
type StoredAI = {
  enabled?: boolean;
  aiSide?: 'Light' | 'Dark';
  difficulty?: number; // 1..20
  timeMode?: 'auto' | 'manual';
  timeSeconds?: number;
  useWorkers?: boolean;
};

function loadStoredAI(): StoredAI | undefined {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as StoredAI;
  } catch {
    // ignore
  }
  return undefined;
}

function saveStoredAI(ai: StoredAI): void {
  try {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(ai));
  } catch {
    // ignore
  }
}

const storedAI = loadStoredAI();
if (storedAI) {
  if (typeof storedAI.enabled === 'boolean') store.dispatch(setAIEnabled(storedAI.enabled));
  if (storedAI.aiSide === 'Light' || storedAI.aiSide === 'Dark') store.dispatch(setAISide(storedAI.aiSide));
  if (typeof storedAI.difficulty === 'number') store.dispatch(setAIDifficulty(storedAI.difficulty));
  if (storedAI.timeMode === 'auto' || storedAI.timeMode === 'manual') store.dispatch(setAITimeMode(storedAI.timeMode));
  if (typeof storedAI.timeSeconds === 'number') store.dispatch(setAITimeSeconds(storedAI.timeSeconds));
  if (typeof storedAI.useWorkers === 'boolean') store.dispatch(setAIUseWorkers(storedAI.useWorkers));
}

let lastSavedAI: StoredAI | undefined;
store.subscribe(() => {
  const state = store.getState() as RootState;
  const ai = state.game.ai;
  if (!ai) return;
  const toSave: StoredAI = {
    enabled: ai.enabled,
    aiSide: ai.aiSide,
    difficulty: ai.difficulty,
    timeMode: ai.timeMode,
    timeSeconds: ai.timeSeconds,
    useWorkers: ai.useWorkers,
  };
  const changed = JSON.stringify(toSave) !== JSON.stringify(lastSavedAI);
  if (changed) {
    saveStoredAI(toSave);
    lastSavedAI = toSave;
  }
});
