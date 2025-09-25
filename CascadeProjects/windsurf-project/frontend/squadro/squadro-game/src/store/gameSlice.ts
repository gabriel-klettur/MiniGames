import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { GameState, Player, AISpeed } from '../game/types';
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
    // --- AI settings ---
    setAIEnabled(state: GameState, action: PayloadAction<boolean>) {
      if (!state.ai) state.ai = {
        enabled: false,
        aiSide: 'Dark',
        difficulty: 3,
        speed: 'normal',
        timeMode: 'manual',
        timeSeconds: 10,
      };
      state.ai.enabled = action.payload;
    },
    setAISide(state: GameState, action: PayloadAction<Player>) {
      if (!state.ai) return;
      state.ai.aiSide = action.payload;
    },
    setAIDifficulty(state: GameState, action: PayloadAction<number>) {
      if (!state.ai) return;
      const d = Math.max(1, Math.min(10, Math.round(action.payload)));
      state.ai.difficulty = d;
    },
    setAISpeed(state: GameState, action: PayloadAction<AISpeed>) {
      if (!state.ai) return;
      const speed = action.payload;
      state.ai.speed = speed;
      if (speed === 'auto') {
        state.ai.timeMode = 'auto';
        state.ai.timeSeconds = 0;
      } else {
        state.ai.timeMode = 'manual';
        state.ai.timeSeconds = speed === 'rapido' ? 5 : speed === 'normal' ? 10 : 30;
      }
    },
    setAITimeMode(state: GameState, action: PayloadAction<'auto' | 'manual'>) {
      if (!state.ai) return;
      state.ai.timeMode = action.payload;
    },
    setAITimeSeconds(state: GameState, action: PayloadAction<number>) {
      if (!state.ai) return;
      const secs = Math.max(0, Math.min(60, Math.round(action.payload)));
      state.ai.timeSeconds = secs;
    },
    setAIBusy(state: GameState, action: PayloadAction<boolean>) {
      if (!state.ai) return;
      state.ai.busy = action.payload;
    },
  },
});

export const { resetGame, movePiece, setPieceWidth, setPieceHeight, setOrientation, toggleOrientation, setAIEnabled, setAISide, setAIDifficulty, setAISpeed, setAITimeMode, setAITimeSeconds, setAIBusy } = gameSlice.actions;
export default gameSlice.reducer;
