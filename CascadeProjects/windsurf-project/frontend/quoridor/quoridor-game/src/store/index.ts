import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import gameReducer from './gameSlice.ts';
import iaReducer from './iaSlice.ts';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    game: gameReducer,
    ia: iaReducer,
  },
  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
