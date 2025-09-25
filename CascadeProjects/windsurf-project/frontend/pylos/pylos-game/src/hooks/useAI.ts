import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../game/types';
import { posKey } from '../game/board';
import { applyMove } from '../ia/moves';
import type { AIMove } from '../ia/moves';
import { computeBestMoveAsync } from '../ia';
import bolaA from '../assets/bola_a.webp';
import bolaB from '../assets/bola_b.webp';
import type { MoveEntry } from './usePersistence';
import type { FlyingPieceState } from './useAnimations';

export interface UseAIParams {
  state: GameState;
  iaDepth: number;
  iaTimeMode: 'auto' | 'manual';
  iaTimeSeconds: number;
  iaConfig?: {
    quiescence: boolean;
    qDepthMax: number;
    qNodeCap: number;
    futilityMargin: number;
    bookEnabled: boolean;
    bookUrl?: string;
  };

  // Environment flags and refs
  vsAI: null | { enemy: 'L' | 'D'; depth: number };
  atPresent: boolean; // redo.length === 0
  gameOver: string | undefined;
  flying: FlyingPieceState | null;
  autoRunningRef: React.MutableRefObject<boolean>;
  reserveLightRef: React.MutableRefObject<HTMLSpanElement | null>;
  reserveDarkRef: React.MutableRefObject<HTMLSpanElement | null>;
  redoingRef: React.MutableRefObject<boolean>;

  // Animation and state application helpers
  setPendingState: React.Dispatch<React.SetStateAction<GameState | null>>;
  setPendingLog: React.Dispatch<React.SetStateAction<MoveEntry | null>>;
  pendingApplyRef: React.MutableRefObject<{ pushHistory: boolean; clearRedo: boolean }>;
  setFlying: React.Dispatch<React.SetStateAction<FlyingPieceState | null>>;
  setAppearKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
  updateAndCheck: (nextState: GameState, pushHistory?: boolean, clearRedo?: boolean, logEntry?: MoveEntry) => void;
}

export interface UseAIResult {
  iaBusy: boolean;
  aiDisabled: boolean;
  iaAutoplay: boolean;
  setIaAutoplay: React.Dispatch<React.SetStateAction<boolean>>;
  iaProgress: { depth: number; score: number } | null;
  iaEval: number | null;
  iaDepthReached: number | null;
  iaPV: AIMove[];
  iaRootMoves: Array<{ move: AIMove; score: number }>;
  iaNodes: number;
  iaElapsedMs: number;
  iaNps: number;
  iaRootPlayer: 'L' | 'D' | null;
  onAIMove: () => Promise<void>;
}

/**
 * Centraliza el pensamiento de la IA, métricas y auto-juego.
 * Preserva el comportamiento original de App.tsx.
 */
export function useAI(params: UseAIParams): UseAIResult {
  const {
    state,
    iaDepth,
    iaTimeMode,
    iaTimeSeconds,
    iaConfig,
    vsAI,
    atPresent,
    gameOver,
    flying,
    autoRunningRef,
    reserveLightRef,
    reserveDarkRef,
    redoingRef,
    setPendingState,
    setPendingLog,
    pendingApplyRef,
    setFlying,
    setAppearKeys,
    updateAndCheck,
  } = params;

  const iaAutoTimerRef = useRef<number | null>(null);
  const [iaAutoplay, setIaAutoplay] = useState<boolean>(false);

  const [iaBusy, setIaBusy] = useState<boolean>(false);
  const [iaProgress, setIaProgress] = useState<{ depth: number; score: number } | null>(null);
  const [iaEval, setIaEval] = useState<number | null>(null);
  const [iaDepthReached, setIaDepthReached] = useState<number | null>(null);
  const [iaPV, setIaPV] = useState<AIMove[]>([]);
  const [iaRootMoves, setIaRootMoves] = useState<Array<{ move: AIMove; score: number }>>([]);
  const [iaNodes, setIaNodes] = useState<number>(0);
  const [iaElapsedMs, setIaElapsedMs] = useState<number>(0);
  const [iaNps, setIaNps] = useState<number>(0);
  const [iaRootPlayer, setIaRootPlayer] = useState<'L' | 'D' | null>(null);
  const iaAbortRef = useRef<AbortController | null>(null);

  // Disable AI when navigating the past or during animations, etc.
  const aiDisabled = !!gameOver || state.phase === 'recover' || !!flying || autoRunningRef.current || (!!vsAI && !atPresent);

  const onAIMove = async () => {
    if (aiDisabled || iaBusy) return;
    setIaBusy(true);
    setIaProgress(null);
    setIaEval(null);
    setIaDepthReached(null);
    setIaPV([]);
    setIaRootMoves([]);
    setIaNodes(0);
    setIaElapsedMs(0);
    setIaNps(0);
    // Capture the AI's player at the moment thinking starts to avoid races
    const aiPlayer: 'L' | 'D' = state.currentPlayer;
    setIaRootPlayer(aiPlayer);
    const ac = new AbortController();
    iaAbortRef.current = ac;
    try {
      // Resolve time budget
      const timeMs = iaTimeMode === 'auto' ? undefined : Math.max(0, Math.min(30, iaTimeSeconds)) * 1000;
      const res = await computeBestMoveAsync(state, {
        depth: iaDepth,
        timeMs,
        signal: ac.signal,
        onProgress: (info) => setIaProgress(info),
        cfg: {
          search: {
            quiescence: iaConfig?.quiescence ?? true,
            qDepthMax: iaConfig?.qDepthMax ?? 2,
            qNodeCap: iaConfig?.qNodeCap ?? 24,
            futilityMargin: iaConfig?.futilityMargin ?? 100,
          },
          bookEnabled: iaConfig?.bookEnabled ?? true,
          bookUrl: iaConfig?.bookUrl,
        },
      });
      // Save metrics and PV for visualization ALWAYS
      setIaEval(res.score);
      setIaDepthReached(res.depthReached);
      setIaPV(res.pv);
      setIaRootMoves(res.rootMoves);
      setIaNodes(res.nodes);
      setIaElapsedMs(res.elapsedMs);
      setIaNps(res.nps);
      if (res.move) {
        if (res.move.kind === 'place') {
          const dest = res.move.dest;
          const key = posKey(dest);
          const originEl = aiPlayer === 'L' ? reserveLightRef.current : reserveDarkRef.current;
          const originRect = originEl?.getBoundingClientRect();
          const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${key}"]`);
          const destRect = destBtn?.getBoundingClientRect();
          const imgSrc = aiPlayer === 'L' ? bolaB : bolaA;
          const nextState = applyMove(state, res.move);
          if (originRect && destRect) {
            const from = { left: originRect.left, top: originRect.top, width: originRect.width, height: originRect.height };
            const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
            setPendingState(nextState);
            setPendingLog({ player: aiPlayer, source: 'IA', text: `colocar ${key}` });
            pendingApplyRef.current = { pushHistory: true, clearRedo: true };
            setFlying({ from, to, imgSrc, destKey: key });
          } else {
            setAppearKeys(new Set([key]));
            updateAndCheck(nextState, true, true, { player: aiPlayer, source: 'IA', text: `colocar ${key}` });
          }
        } else if (res.move.kind === 'lift') {
          const srcKey = posKey(res.move.src);
          const destKey = posKey(res.move.dest);
          const srcBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${srcKey}"]`);
          const destBtn = document.querySelector<HTMLButtonElement>(`[data-poskey="${destKey}"]`);
          const srcRect = srcBtn?.getBoundingClientRect();
          const destRect = destBtn?.getBoundingClientRect();
          const imgSrc = aiPlayer === 'L' ? bolaB : bolaA;
          const nextState = applyMove(state, res.move);
          if (srcRect && destRect) {
            const from = { left: srcRect.left, top: srcRect.top, width: srcRect.width, height: srcRect.height };
            const to = { left: destRect.left, top: destRect.top, width: destRect.width, height: destRect.height };
            setPendingState(nextState);
            setPendingLog({ player: aiPlayer, source: 'IA', text: `subir ${srcKey} -> ${destKey}` });
            pendingApplyRef.current = { pushHistory: true, clearRedo: true };
            setFlying({ from, to, imgSrc, destKey });
          } else {
            setAppearKeys(new Set([destKey]));
            updateAndCheck(nextState, true, true, { player: aiPlayer, source: 'IA', text: `subir ${srcKey} -> ${destKey}` });
          }
        }
      }
    } catch (err) {
      // Ignore AbortError or transient errors
    } finally {
      iaAbortRef.current = null;
      setIaBusy(false);
      setIaProgress(null);
    }
  };

  // Cancel AI search if unmounting
  useEffect(() => {
    return () => {
      if (iaAbortRef.current) iaAbortRef.current.abort();
    };
  }, []);

  // Vs AI: if it's enemy's turn, let AI move automatically (unless manual autoplay is active)
  useEffect(() => {
    if (!vsAI) return;
    if (iaAutoplay) return;
    if (!atPresent) return;
    if (redoingRef.current) return;
    if (gameOver) return;
    if (iaBusy) return;
    if (aiDisabled) return;
    if (state.currentPlayer !== vsAI.enemy) return;
    const t = setTimeout(() => {
      void onAIMove();
    }, 50);
    return () => clearTimeout(t);
  }, [vsAI, atPresent, state.currentPlayer, iaBusy, aiDisabled, gameOver, iaAutoplay]);

  // IA autoplay manual: play every ~2s while active and conditions allow
  useEffect(() => {
    if (iaAutoTimerRef.current !== null) {
      clearTimeout(iaAutoTimerRef.current);
      iaAutoTimerRef.current = null;
    }
    if (!iaAutoplay) return;
    if (gameOver) {
      setIaAutoplay(false);
      return;
    }
    if (iaBusy || aiDisabled) return;
    iaAutoTimerRef.current = window.setTimeout(() => {
      if (!iaAutoplay || gameOver) return;
      if (iaBusy || aiDisabled) return;
      void onAIMove();
    }, 2000);
    return () => {
      if (iaAutoTimerRef.current !== null) {
        clearTimeout(iaAutoTimerRef.current);
        iaAutoTimerRef.current = null;
      }
    };
  }, [iaAutoplay, iaBusy, aiDisabled, gameOver, state.currentPlayer, flying]);

  return {
    iaBusy,
    aiDisabled,
    iaAutoplay,
    setIaAutoplay,
    iaProgress,
    iaEval,
    iaDepthReached,
    iaPV,
    iaRootMoves,
    iaNodes,
    iaElapsedMs,
    iaNps,
    iaRootPlayer,
    onAIMove,
  };
}

