import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { IAPreset } from '../ia/presets';
import type { EvalParams } from '../ia/evalTypes';
import type { GameState, Player } from '../game/types';
import { createInitialState } from '../game/pieces';
import { getSelectedEvalPresetId, findEvalPresetById } from '../ia/evalPresets';
import { movePiece as movePieceRules } from '../game/rules';

const initialState: GameState = createInitialState();

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    resetGame(state: GameState) {
      const prevAI = state.ai ? { ...state.ai } : undefined;
      const next = createInitialState();
      // Reset core game state
      state.lanesByPlayer = next.lanesByPlayer;
      state.pieces = next.pieces;
      state.turn = next.turn;
      state.winner = next.winner;
      // Preserve UI and AI settings across resets (do NOT disable VS IA)
      if (prevAI) {
        state.ai = {
          ...prevAI,
          busy: false,
          nodesVisited: 0,
          startedAt: undefined,
          lastDurationMs: undefined,
          depthReached: 0,
          lastScore: undefined,
          // Reset opening counter each new game
          openingPliesUsed: 0,
        } as typeof prevAI;
      }
      // Apply selected heuristic preset (global) at game start
      try {
        const sel = getSelectedEvalPresetId();
        if (sel) {
          const p = findEvalPresetById(sel);
          if (p && p.weights) {
            const w = p.weights as EvalParams;
            if (!state.ai) state.ai = next.ai!;
            const ew: any = (state.ai.evalWeights ||= {} as any);
            ew['Light'] = { ...(ew['Light'] || {}), ...w };
            ew['Dark'] = { ...(ew['Dark'] || {}), ...w };
          }
        }
      } catch {}
    },
    movePiece(state: GameState, action: PayloadAction<string>) {
      // Apply game rules for a single move, guard against invalid moves.
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
    setPieceRotateMs(state: GameState, action: PayloadAction<number>) {
      const v = Math.max(0, Math.min(3000, Math.round(action.payload)));
      (state.ui as any).pieceRotateMs = v;
    },
    // Board scaling (visual only)
    setBoardScale(state: GameState, action: PayloadAction<number>) {
      const v = Math.max(0.5, Math.min(2.0, Number(action.payload)));
      (state.ui as any).boardScale = v;
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
      // Apply eval weights from selected eval preset (or fallback to 'balanced') on difficulty change
      try {
        const sel = getSelectedEvalPresetId();
        const preset = (sel ? findEvalPresetById(sel) : null) || findEvalPresetById('balanced');
        if (preset && preset.weights) {
          const ew: any = (state.ai.evalWeights ||= {} as any);
          ew['Light'] = { ...(ew['Light'] || {}), ...(preset.weights as any) } as any;
          ew['Dark']  = { ...(ew['Dark']  || {}), ...(preset.weights as any) } as any;
        }
      } catch {}
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
    // --- Opening randomization ---
    setAiRandomOpeningPlies(state: GameState, action: PayloadAction<number>) {
      if (!state.ai) return;
      const n = Math.max(0, Math.min(20, Math.round(action.payload)));
      (state.ai as any).randomOpeningPlies = n;
      // If reduced below used, clamp used
      if (typeof (state.ai as any).openingPliesUsed === 'number') {
        (state.ai as any).openingPliesUsed = Math.max(0, Math.min((state.ai as any).openingPliesUsed, n));
      }
    },
    incAiOpeningPliesUsed(state: GameState) {
      if (!state.ai) return;
      const used = Number((state.ai as any).openingPliesUsed || 0) + 1;
      (state.ai as any).openingPliesUsed = used;
    },
    resetAiOpeningPliesUsed(state: GameState) {
      if (!state.ai) return;
      (state.ai as any).openingPliesUsed = 0;
    },
    // --- Engine toggles/params ---
    setAiEnableTT(state: GameState, action: PayloadAction<boolean>) { if (!state.ai) return; state.ai.enableTT = !!action.payload; },
    setAiFailSoft(state: GameState, action: PayloadAction<boolean>) { if (!state.ai) return; state.ai.failSoft = !!action.payload; },
    setAiPreferHashMove(state: GameState, action: PayloadAction<boolean>) { if (!state.ai) return; state.ai.preferHashMove = !!action.payload; },
    setAiEnablePVS(state: GameState, action: PayloadAction<boolean>) { if (!state.ai) return; state.ai.enablePVS = !!action.payload; },
    setAiEnableKillers(state: GameState, action: PayloadAction<boolean>) { if (!state.ai) return; state.ai.enableKillers = !!action.payload; },
    setAiEnableHistory(state: GameState, action: PayloadAction<boolean>) { if (!state.ai) return; state.ai.enableHistory = !!action.payload; },
    setAiEnableLMR(state: GameState, action: PayloadAction<boolean>) { if (!state.ai) return; state.ai.enableLMR = !!action.payload; },
    // Quiescence toggles/params
    setAiEnableQuiescence(state: GameState, action: PayloadAction<boolean>) { if (!state.ai) return; state.ai.enableQuiescence = !!action.payload; },
    setAiQuiescenceDepth(state: GameState, action: PayloadAction<number>) { if (!state.ai) return; state.ai.quiescenceDepth = Math.max(1, Math.min(12, Math.round(action.payload))); },
    setAiLmrMinDepth(state: GameState, action: PayloadAction<number>) { if (!state.ai) return; state.ai.lmrMinDepth = Math.max(0, Math.min(20, Math.round(action.payload))); },
    setAiLmrLateMoveIdx(state: GameState, action: PayloadAction<number>) { if (!state.ai) return; state.ai.lmrLateMoveIdx = Math.max(0, Math.min(20, Math.round(action.payload))); },
    setAiLmrReduction(state: GameState, action: PayloadAction<number>) { if (!state.ai) return; state.ai.lmrReduction = Math.max(0, Math.min(4, Math.round(action.payload))); },
    // Move ordering jitter (stochastic tie-breaker)
    setAiOrderingJitterEps(state: GameState, action: PayloadAction<number>) {
      if (!state.ai) return; state.ai.orderingJitterEps = Math.max(0, Number(action.payload));
    },
    // DF-PN and Tablebase toggles/params
    setAiEnableDFPN(state: GameState, action: PayloadAction<boolean>) { if (!state.ai) return; (state.ai as any).enableDFPN = !!action.payload; },
    setAiDfpnMaxActive(state: GameState, action: PayloadAction<number>) { if (!state.ai) return; (state.ai as any).dfpnMaxActive = Math.max(0, Math.min(10, Math.round(action.payload))); },
    setAiEnableTablebase(state: GameState, action: PayloadAction<boolean>) { if (!state.ai) return; (state.ai as any).enableTablebase = !!action.payload; },
    // Apply multiple AI settings from a preset (difficulty, workers, speed/time)
    applyIAPreset(state: GameState, action: PayloadAction<IAPreset['settings']>) {
      if (!state.ai) {
        state.ai = {
          enabled: false,
          aiSide: 'Dark',
          difficulty: 3,
          timeMode: 'manual',
          timeSeconds: 10,
        };
      }
      const s = action.payload || {};
      if (typeof s.difficulty === 'number') {
        const d = Math.max(1, Math.min(20, Math.round(s.difficulty)));
        state.ai.difficulty = d;
      }
      if (typeof s.useWorkers === 'boolean') {
        state.ai.useWorkers = !!s.useWorkers;
      }
      // Speed is deprecated in presets; only honor explicit timeMode/timeSeconds
      if (s.timeMode) state.ai.timeMode = s.timeMode;
      {
        const mode = s.timeMode ?? state.ai.timeMode;
        if (mode === 'auto') {
          state.ai.timeSeconds = 0;
        } else if (typeof s.timeSeconds === 'number') {
          const secs = Math.max(0, Math.min(60, Math.round(s.timeSeconds)));
          state.ai.timeSeconds = secs;
        }
      }
      // Advanced time (Auto) removed: Auto is unlimited now
      // Engine toggles
      if (typeof (s as any).enableTT === 'boolean') state.ai.enableTT = !!(s as any).enableTT;
      if (typeof (s as any).failSoft === 'boolean') state.ai.failSoft = !!(s as any).failSoft;
      if (typeof (s as any).preferHashMove === 'boolean') state.ai.preferHashMove = !!(s as any).preferHashMove;
      if (typeof (s as any).enablePVS === 'boolean') state.ai.enablePVS = !!(s as any).enablePVS;
      if (typeof (s as any).enableKillers === 'boolean') state.ai.enableKillers = !!(s as any).enableKillers;
      if (typeof (s as any).enableHistory === 'boolean') state.ai.enableHistory = !!(s as any).enableHistory;
      if (typeof (s as any).enableLMR === 'boolean') state.ai.enableLMR = !!(s as any).enableLMR;
      // Quiescence
      if (typeof (s as any).enableQuiescence === 'boolean') state.ai.enableQuiescence = !!(s as any).enableQuiescence;
      if (typeof (s as any).quiescenceMaxPlies === 'number') state.ai.quiescenceDepth = Math.max(1, Math.min(12, Math.round((s as any).quiescenceMaxPlies)));
      if (typeof (s as any).quiescenceStandPatMargin === 'number') (state.ai as any).quiescenceStandPatMargin = Number((s as any).quiescenceStandPatMargin);
      if (typeof (s as any).quiescenceSeeMargin === 'number') (state.ai as any).quiescenceSeeMargin = Number((s as any).quiescenceSeeMargin);
      if (typeof (s as any).quiescenceExtendOnRetire === 'boolean') (state.ai as any).quiescenceExtendOnRetire = !!(s as any).quiescenceExtendOnRetire;
      if (typeof (s as any).quiescenceExtendOnJump === 'boolean') (state.ai as any).quiescenceExtendOnJump = !!(s as any).quiescenceExtendOnJump;
      // DF-PN
      if (typeof (s as any).enableDFPN === 'boolean') (state.ai as any).enableDFPN = !!(s as any).enableDFPN;
      if (typeof (s as any).enableAdaptiveTime === 'boolean') (state.ai as any).enableAdaptiveTime = !!(s as any).enableAdaptiveTime;
      if (typeof (s as any).forceFullDepth === 'boolean') (state.ai as any).forceFullDepth = !!(s as any).forceFullDepth;
      // LMR params
      if (typeof (s as any).lmrMinDepth === 'number') state.ai.lmrMinDepth = Math.max(0, Math.min(20, Math.round((s as any).lmrMinDepth)));
      if (typeof (s as any).lmrLateMoveIdx === 'number') state.ai.lmrLateMoveIdx = Math.max(0, Math.min(20, Math.round((s as any).lmrLateMoveIdx)));
      if (typeof (s as any).lmrReduction === 'number') state.ai.lmrReduction = Math.max(0, Math.min(4, Math.round((s as any).lmrReduction)));
      // LMP / Futility / IID
      if (typeof (s as any).enableLMP === 'boolean') (state.ai as any).enableLMP = !!(s as any).enableLMP;
      if (typeof (s as any).lmpMaxDepth === 'number') (state.ai as any).lmpMaxDepth = Math.max(0, Math.min(6, Math.round((s as any).lmpMaxDepth)));
      if (typeof (s as any).lmpBase === 'number') (state.ai as any).lmpBase = Math.max(0, Math.min(16, Math.round((s as any).lmpBase)));
      if (typeof (s as any).enableFutility === 'boolean') (state.ai as any).enableFutility = !!(s as any).enableFutility;
      if (typeof (s as any).futilityMargin === 'number') (state.ai as any).futilityMargin = Math.max(0, Math.min(1000, Math.round((s as any).futilityMargin)));
      if (typeof (s as any).enableQuiescence === 'boolean') (state.ai as any).enableQuiescence = !!(s as any).enableQuiescence;
      if (typeof (s as any).quiescenceMaxPlies === 'number') (state.ai as any).quiescenceMaxPlies = Math.max(0, Math.min(12, Math.round((s as any).quiescenceMaxPlies)));
      // Tablebase fast-path
      if (typeof (s as any).enableTablebase === 'boolean') (state.ai as any).enableTablebase = !!(s as any).enableTablebase;
      if (typeof (s as any).enableLMP === 'boolean') (state.ai as any).enableLMP = !!(s as any).enableLMP;
      if (typeof (s as any).dfpnMaxActive === 'number') (state.ai as any).dfpnMaxActive = Math.max(0, Math.min(10, Math.round((s as any).dfpnMaxActive)));
      // Ordering jitter
      if (typeof (s as any).orderingJitterEps === 'number') state.ai.orderingJitterEps = Math.max(0, Number((s as any).orderingJitterEps));
      // Heuristic weights (global -> apply to Light/Dark)
      if ((s as any).evalWeights && typeof (s as any).evalWeights === 'object') {
        const w = (s as any).evalWeights as Partial<EvalParams>;
        const ew: any = (state.ai.evalWeights ||= {} as any);
        ew['Light'] = { ...(ew['Light'] || {}), ...w } as any;
        ew['Dark']  = { ...(ew['Dark']  || {}), ...w } as any;
      }
      // Opening randomization (optional in presets)
      if (typeof (s as any).randomOpeningPlies === 'number') {
        const n = Math.max(0, Math.min(20, Math.round((s as any).randomOpeningPlies)));
        (state.ai as any).randomOpeningPlies = n;
        (state.ai as any).openingPliesUsed = 0;
      }
    },
    setAIBusy(state: GameState, action: PayloadAction<boolean>) {
      if (!state.ai) return;
      state.ai.busy = action.payload;
    },
    // --- Evaluation weights (per player) ---
    setAIEvalWeights(state: GameState, action: PayloadAction<{ player: Player; weights: Partial<EvalParams> }>) {
      if (!state.ai) return;
      const { player, weights } = action.payload;
      const ew = (state.ai.evalWeights ||= {} as any) as any;
      const prev = ew[player] || {};
      ew[player] = { ...prev, ...weights } as any;
    },
    // --- AI instrumentation (ephemeral) ---
    aiSearchStarted(state: GameState, action: PayloadAction<number | undefined>) {
      if (!state.ai) return;
      state.ai.startedAt = typeof action.payload === 'number' ? action.payload : Date.now();
      state.ai.nodesVisited = 0;
      state.ai.depthReached = 0;
      state.ai.lastScore = undefined;
      state.ai.lastDurationMs = undefined;
      state.ai.engineStats = undefined as any;
    },
    aiSearchProgress(state: GameState, action: PayloadAction<number>) {
      if (!state.ai) return;
      state.ai.nodesVisited = action.payload;
    },
    aiSearchIter(state: GameState, action: PayloadAction<{ depth: number; score: number; pv?: string[] }>) {
      if (!state.ai) return;
      state.ai.depthReached = action.payload.depth;
      state.ai.lastScore = action.payload.score;
      if (action.payload.pv) {
        (state.ai as any).pv = action.payload.pv.slice();
      }
    },
    aiSearchEnded(state: GameState, action: PayloadAction<{ durationMs: number; depthReached: number; score: number; nodesVisited: number; engineStats?: { ttProbes?: number; ttHits?: number; cutoffs?: number; pvsReSearches?: number; lmrReductions?: number } }>) {
      if (!state.ai) return;
      state.ai.lastDurationMs = action.payload.durationMs;
      state.ai.depthReached = action.payload.depthReached;
      state.ai.lastScore = action.payload.score;
      state.ai.nodesVisited = action.payload.nodesVisited;
      if (action.payload.engineStats) state.ai.engineStats = { ...action.payload.engineStats } as any;
    },
    aiSearchReset(state: GameState) {
      if (!state.ai) return;
      state.ai.nodesVisited = 0;
      state.ai.depthReached = 0;
      state.ai.lastScore = undefined;
      state.ai.lastDurationMs = undefined;
      state.ai.startedAt = undefined;
      state.ai.engineStats = undefined as any;
    },
  },
});

export const { resetGame, movePiece, setPieceWidth, setPieceHeight, setPieceHeightLight, setPieceHeightDark, setPieceScale, setPieceWidthScaleLight, setPieceWidthScaleDark, setShowPieces, setPieceAnimMs, setPieceRotateMs, setBoardScale, setShowCoordsOverlay, setShowPipIndicators, setCalibrationOverlay, setCalibrationOriginX, setCalibrationOriginY, setCalibrationPitchScaleX, setCalibrationPitchScaleY, setOrientation, toggleOrientation, setAIEnabled, setAISide, setAIDifficulty, setAIUseWorkers, setAITimeMode, setAITimeSeconds, setAiRandomOpeningPlies, incAiOpeningPliesUsed, resetAiOpeningPliesUsed, setAiEnableTT, setAiFailSoft, setAiPreferHashMove, setAiEnablePVS, setAiEnableKillers, setAiEnableHistory, setAiEnableLMR, setAiEnableQuiescence, setAiQuiescenceDepth, setAiLmrMinDepth, setAiLmrLateMoveIdx, setAiLmrReduction, setAiOrderingJitterEps, setAiEnableDFPN, setAiDfpnMaxActive, setAiEnableTablebase, setAIBusy, setAIEvalWeights, aiSearchStarted, aiSearchProgress, aiSearchIter, aiSearchEnded, aiSearchReset, applyIAPreset } = gameSlice.actions;
export default gameSlice.reducer;
