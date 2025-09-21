import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  darkMode: boolean;
  showDevTools: boolean;
  showRules: boolean;
  showIA: boolean;
  showHistory: boolean;
  showFases: boolean;
  showUX: boolean;
}

const initialState: UIState = {
  darkMode: true,
  showDevTools: false,
  showRules: false,
  showIA: false,
  showHistory: false,
  showFases: true,
  showUX: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode(state) { state.darkMode = !state.darkMode; },
    setDarkMode(state, action: PayloadAction<boolean>) { state.darkMode = action.payload; },
    toggleDevTools(state) { state.showDevTools = !state.showDevTools; },
    toggleRules(state) { state.showRules = !state.showRules; },
    toggleIA(state) { state.showIA = !state.showIA; },
    toggleHistory(state) { state.showHistory = !state.showHistory; },
    toggleFases(state) { state.showFases = !state.showFases; },
    toggleUX(state) { state.showUX = !state.showUX; },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  toggleDevTools,
  toggleRules,
  toggleIA,
  toggleHistory,
  toggleFases,
  toggleUX,
} = uiSlice.actions;

export default uiSlice.reducer;
