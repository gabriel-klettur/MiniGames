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
      const prevAI = state.ai ? { ...state.ai } : undefined;
      const next = createInitialState();
      state.lanesByPlayer = next.lanesByPlayer;
      state.pieces = next.pieces;
      state.turn = next.turn;
      state.winner = next.winner;
      // Preserve UI settings (including orientation and piece sizes) across resets
      // Preserve AI settings across resets (do NOT disable VS IA when starting una nueva partida)
      if (prevAI) {
        state.ai = {
          ...prevAI,
          busy: false,
          nodesVisited: 0,
          startedAt: undefined,
          lastDurationMs: undefined,
          depthReached: 0,
          lastScore: undefined,
        } as typeof prevAI;
      }
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
    setPieceHeightLight(state: GameState, action: PayloadAction<number>) {
      const v = Math.max(24, Math.min(120, Math.round(action.payload)));
      state.ui.pieceHeightLight = v;
    },
    setPieceHeightDark(state: GameState, action: PayloadAction<number>) {
      const v = Math.max(24, Math.min(120, Math.round(action.payload)));
      state.ui.pieceHeightDark = v;
    },
    setPieceScale(state: GameState, action: PayloadAction<number>) {
      const v = Math.max(0.3, Math.min(2.0, Number(action.payload)));
      state.ui.pieceScale = v;
    },
    setPieceWidthScaleLight(state: GameState, action: PayloadAction<number>) {
      const v = Math.max(0.5, Math.min(2.0, Number(action.payload)));
      state.ui.pieceWidthScaleLight = v;
    },
    setPieceWidthScaleDark(state: GameState, action: PayloadAction<number>) {
      const v = Math.max(0.5, Math.min(2.0, Number(action.payload)));
      state.ui.pieceWidthScaleDark = v;
    },
    // Piece visibility & movement animation
    setShowPieces(state: GameState, action: PayloadAction<boolean>) {
      state.ui.showPieces = !!action.payload;
    },
    setPieceAnimMs(state: GameState, action: PayloadAction<number>) {
      const v = Math.max(0, Math.min(2000, Math.round(action.payload)));
      state.ui.pieceAnimMs = v;
    },
    // Debug overlays
    setShowCoordsOverlay(state: GameState, action: PayloadAction<boolean>) {
      state.ui.showCoordsOverlay = !!action.payload;
    },
    setShowPipIndicators(state: GameState, action: PayloadAction<boolean>) {
      state.ui.showPipIndicators = !!action.payload;
    },
    // --- UI calibration ---
    setCalibrationOverlay(state: GameState, action: PayloadAction<boolean>) {
      const cal = (state.ui.calibration ?? (state.ui.calibration = { originX: 0, originY: 0, pitchScaleX: 1, pitchScaleY: 1, showOverlay: false } as any));
      cal.showOverlay = !!action.payload;
    },
    setCalibrationOriginX(state: GameState, action: PayloadAction<number>) {
      const cal = (state.ui.calibration ?? (state.ui.calibration = { originX: 0, originY: 0, pitchScaleX: 1, pitchScaleY: 1, showOverlay: false } as any));
      // Clamp to a reasonable range to avoid losing pieces off-screen
      const v = Math.max(-100, Math.min(100, Math.round(action.payload)));
      cal.originX = v;
    },
    setCalibrationOriginY(state: GameState, action: PayloadAction<number>) {
      const cal = (state.ui.calibration ?? (state.ui.calibration = { originX: 0, originY: 0, pitchScaleX: 1, pitchScaleY: 1, showOverlay: false } as any));
      const v = Math.max(-100, Math.min(100, Math.round(action.payload)));
      cal.originY = v;
    },
    setCalibrationPitchScaleX(state: GameState, action: PayloadAction<number>) {
      const cal = (state.ui.calibration ?? (state.ui.calibration = { originX: 0, originY: 0, pitchScaleX: 1, pitchScaleY: 1, showOverlay: false } as any));
      const v = Math.max(0.8, Math.min(1.2, Number(action.payload)));
      (cal as any).pitchScaleX = v;
    },
    setCalibrationPitchScaleY(state: GameState, action: PayloadAction<number>) {
      const cal = (state.ui.calibration ?? (state.ui.calibration = { originX: 0, originY: 0, pitchScaleX: 1, pitchScaleY: 1, showOverlay: false } as any));
      const v = Math.max(0.8, Math.min(1.2, Number(action.payload)));
      (cal as any).pitchScaleY = v;
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
      const d = Math.max(1, Math.min(20, Math.round(action.payload)));
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
    setAIUseWorkers(state: GameState, action: PayloadAction<boolean>) {
      if (!state.ai) return;
      state.ai.useWorkers = !!action.payload;
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
    // --- AI instrumentation (ephemeral) ---
    aiSearchStarted(state: GameState, action: PayloadAction<number | undefined>) {
      if (!state.ai) return;
      state.ai.startedAt = typeof action.payload === 'number' ? action.payload : Date.now();
      state.ai.nodesVisited = 0;
      state.ai.depthReached = 0;
      state.ai.lastScore = undefined;
      state.ai.lastDurationMs = undefined;
    },
    aiSearchProgress(state: GameState, action: PayloadAction<number>) {
      if (!state.ai) return;
      state.ai.nodesVisited = action.payload;
    },
    aiSearchIter(state: GameState, action: PayloadAction<{ depth: number; score: number }>) {
      if (!state.ai) return;
      state.ai.depthReached = action.payload.depth;
      state.ai.lastScore = action.payload.score;
    },
    aiSearchEnded(state: GameState, action: PayloadAction<{ durationMs: number; depthReached: number; score: number; nodesVisited: number }>) {
      if (!state.ai) return;
      state.ai.lastDurationMs = action.payload.durationMs;
      state.ai.depthReached = action.payload.depthReached;
      state.ai.lastScore = action.payload.score;
      state.ai.nodesVisited = action.payload.nodesVisited;
    },
    aiSearchReset(state: GameState) {
      if (!state.ai) return;
      state.ai.nodesVisited = 0;
      state.ai.depthReached = 0;
      state.ai.lastScore = undefined;
      state.ai.lastDurationMs = undefined;
      state.ai.startedAt = undefined;
    },
  },
});

export const { resetGame, movePiece, setPieceWidth, setPieceHeight, setPieceHeightLight, setPieceHeightDark, setPieceScale, setPieceWidthScaleLight, setPieceWidthScaleDark, setShowPieces, setPieceAnimMs, setShowCoordsOverlay, setShowPipIndicators, setCalibrationOverlay, setCalibrationOriginX, setCalibrationOriginY, setCalibrationPitchScaleX, setCalibrationPitchScaleY, setOrientation, toggleOrientation, setAIEnabled, setAISide, setAIDifficulty, setAISpeed, setAIUseWorkers, setAITimeMode, setAITimeSeconds, setAIBusy, aiSearchStarted, aiSearchProgress, aiSearchIter, aiSearchEnded, aiSearchReset } = gameSlice.actions;
export default gameSlice.reducer;
