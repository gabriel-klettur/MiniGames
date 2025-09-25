import { configureStore } from '@reduxjs/toolkit';
import gameReducer, { setPieceHeight, setPieceWidth, setOrientation } from './gameSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// --- UI persistence (localStorage) ---
const UI_STORAGE_KEY = 'squadro_ui';
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
