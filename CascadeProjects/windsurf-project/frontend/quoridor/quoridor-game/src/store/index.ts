import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import gameReducer from './gameSlice.ts';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    game: gameReducer,
  },
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
