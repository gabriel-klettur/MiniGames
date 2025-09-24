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
  },
});

export const { resetGame, movePiece } = gameSlice.actions;
export default gameSlice.reducer;
