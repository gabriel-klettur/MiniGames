import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { GameState } from '../game/types';
import { createInitialState } from '../game/pieces';
import { movePiece as movePieceRules } from '../game/rules';

const initialState: GameState = createInitialState();

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    resetGame(state: GameState) {
      const next = createInitialState();
      state.lanesByPlayer = next.lanesByPlayer;
      state.pieces = next.pieces;
      state.turn = next.turn;
      state.winner = next.winner;
      // Preserve UI settings (including orientation and piece sizes) across resets
    },
    movePiece(state: GameState, action: PayloadAction<string>) {
      // Immer allows us to "mutate" safely. Guard against invalid moves.
      try {
        movePieceRules(state, action.payload);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Movimiento inválido:', err);
      }
    },
    setPieceWidth(state: GameState, action: PayloadAction<number>) {
      const v = Math.max(8, Math.min(48, Math.round(action.payload)));
      state.ui.pieceWidth = v;
    },
    setPieceHeight(state: GameState, action: PayloadAction<number>) {
      const v = Math.max(24, Math.min(120, Math.round(action.payload)));
      state.ui.pieceHeight = v;
    },
    setOrientation(state: GameState, action: PayloadAction<'classic' | 'bga'>) {
      state.ui.orientation = action.payload;
    },
    toggleOrientation(state: GameState) {
      state.ui.orientation = state.ui.orientation === 'classic' ? 'bga' : 'classic';
    },
  },
});

export const { resetGame, movePiece, setPieceWidth, setPieceHeight, setOrientation, toggleOrientation } = gameSlice.actions;
export default gameSlice.reducer;
