import { configureStore } from '@reduxjs/toolkit';
import gameReducer, { setPieceHeight, setPieceWidth, setOrientation, setAIEnabled, setAISide, setAIDifficulty, setAISpeed, setAIUseWorkers, setAITimeMode, setAITimeSeconds } from './gameSlice';

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
  orientation?: 'classic' | 'bga';
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
  if (stored.orientation === 'classic' || stored.orientation === 'bga') store.dispatch(setOrientation(stored.orientation));
}

// Subscribe to store updates to persist UI settings
let lastSaved: StoredUI | undefined;
store.subscribe(() => {
  const state = store.getState() as RootState;
  const ui = state.game.ui;
  const toSave: StoredUI = {
    pieceWidth: ui.pieceWidth,
    pieceHeight: ui.pieceHeight,
    orientation: ui.orientation as 'classic' | 'bga',
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
  speed?: 'auto' | 'rapido' | 'normal' | 'lento';
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
  if (storedAI.speed === 'auto' || storedAI.speed === 'rapido' || storedAI.speed === 'normal' || storedAI.speed === 'lento') store.dispatch(setAISpeed(storedAI.speed));
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
    speed: ai.speed,
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
