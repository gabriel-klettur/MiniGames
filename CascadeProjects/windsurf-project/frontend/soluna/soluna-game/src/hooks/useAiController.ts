import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react';
import { bestMove, type AIMove } from '../ia';
import type { GameAction, GameState } from '../game/types';
import { createWorkerPool, WorkerPool } from '../ia/worker/pool';

export type TimeMode = 'auto' | 'manual';

export interface AiProgress {
  depth: number;
  score: number;
}

export interface AiRootMove { move: AIMove; score: number }

export interface AiController {
  // Settings
  aiDepth: number;
  setAiDepth: (d: number) => void;
  aiTimeMode: TimeMode;
  setAiTimeMode: (m: TimeMode) => void;
  aiTimeSeconds: number;
  setAiTimeSeconds: (s: number) => void;
  aiAutoplay: boolean;
  setAiAutoplay: (next: boolean | ((v: boolean) => boolean)) => void;
  // Per-player toggles
  aiControlP1: boolean;
  setAiControlP1: (next: boolean | ((v: boolean) => boolean)) => void;
  aiControlP2: boolean;
  setAiControlP2: (next: boolean | ((v: boolean) => boolean)) => void;
  // Engine flags
  aiEnableTT: boolean;
  setAiEnableTT: (v: boolean | ((p: boolean) => boolean)) => void;
  aiFailSoft: boolean;
  setAiFailSoft: (v: boolean | ((p: boolean) => boolean)) => void;
  aiPreferHashMove: boolean;
  setAiPreferHashMove: (v: boolean | ((p: boolean) => boolean)) => void;
  aiEnableKillers: boolean;
  setAiEnableKillers: (v: boolean | ((p: boolean) => boolean)) => void;
  aiEnableHistory: boolean;
  setAiEnableHistory: (v: boolean | ((p: boolean) => boolean)) => void;
  aiEnablePVS: boolean;
  setAiEnablePVS: (v: boolean | ((p: boolean) => boolean)) => void;
  aiEnableAspiration: boolean;
  setAiEnableAspiration: (v: boolean | ((p: boolean) => boolean)) => void;
  aiAspirationDelta: number;
  setAiAspirationDelta: (n: number) => void;
  aiEnableQuiescence: boolean;
  setAiEnableQuiescence: (v: boolean | ((p: boolean) => boolean)) => void;
  aiQuiescenceDepth: number;
  setAiQuiescenceDepth: (n: number) => void;
  aiQuiescenceHighTowerThreshold: number;
  setAiQuiescenceHighTowerThreshold: (n: number) => void;

  // Adaptive time (auto mode) configuration
  aiTimeMinMs: number;
  setAiTimeMinMs: (n: number) => void;
  aiTimeMaxMs: number;
  setAiTimeMaxMs: (n: number) => void;
  aiTimeBaseMs: number;
  setAiTimeBaseMs: (n: number) => void;
  aiTimePerMoveMs: number;
  setAiTimePerMoveMs: (n: number) => void;
  aiTimeExponent: number;
  setAiTimeExponent: (n: number) => void;

  // Status
  aiBusy: boolean;
  aiProgress: AiProgress | null;
  aiBusyElapsedMs: number;

  // Metrics
  aiEval: number | null;
  aiPV: AIMove[];
  aiRootMoves: AiRootMove[];
  aiNodes: number;
  aiElapsed: number;
  aiNps: number;
  aiDepthReached: number | null;
  // Detailed metrics
  aiTTProbes: number;
  aiTTHits: number;
  aiCutoffs: number;
  aiPvsReSearches: number;
  aiLmrReductions: number;

  // Controls
  doAIMove: () => void;
  cancel: () => void;
}

/**
 * useAiController
 * Encapsula: creación y ciclo de vida del Worker, fallback en el hilo principal,
 * autoplay, métricas y temporizador de "busy". Diseñado para ser usado desde App.
 */
export function useAiController(state: GameState, dispatch: Dispatch<GameAction>): AiController {
  // Settings
  const [aiDepth, setAiDepth] = useState(2);
  const [aiTimeMode, setAiTimeMode] = useState<TimeMode>('auto');
  const [aiTimeSeconds, setAiTimeSeconds] = useState(3);
  const [aiAutoplay, setAiAutoplay] = useState(false);
  // Per-player control toggles: when on, the AI will move automatically for that player
  const [aiControlP1, setAiControlP1] = useState(false);
  const [aiControlP2, setAiControlP2] = useState(false);

  // Engine flags (defaults aligned with search defaultOptions)
  const [aiEnableTT, setAiEnableTT] = useState(true);
  const [aiFailSoft, setAiFailSoft] = useState(true);
  const [aiPreferHashMove, setAiPreferHashMove] = useState(true);
  const [aiEnableKillers, setAiEnableKillers] = useState(true);
  const [aiEnableHistory, setAiEnableHistory] = useState(true);
  const [aiEnablePVS, setAiEnablePVS] = useState(true);
  const [aiEnableAspiration, setAiEnableAspiration] = useState(true);
  const [aiAspirationDelta, setAiAspirationDelta] = useState(35);
  const [aiEnableQuiescence, setAiEnableQuiescence] = useState(true);
  const [aiQuiescenceDepth, setAiQuiescenceDepth] = useState(3);
  // Quiescence: umbral de torre alta para considerar táctica
  const [aiQuiescenceHighTowerThreshold, setAiQuiescenceHighTowerThreshold] = useState(5);
  // Adaptive time config (aplica en modo auto si el worker no recibe timeMs)
  const [aiTimeMinMs, setAiTimeMinMs] = useState(200);
  const [aiTimeMaxMs, setAiTimeMaxMs] = useState(4000);
  const [aiTimeBaseMs, setAiTimeBaseMs] = useState(150);
  const [aiTimePerMoveMs, setAiTimePerMoveMs] = useState(35);
  const [aiTimeExponent, setAiTimeExponent] = useState(1.0);

  // Status/metrics
  const [aiBusy, setAiBusy] = useState(false);
  const [aiProgress, setAiProgress] = useState<AiProgress | null>(null);
  const [aiEval, setAiEval] = useState<number | null>(null);
  const [aiPV, setAiPV] = useState<AIMove[]>([]);
  const [aiRootMoves, setAiRootMoves] = useState<AiRootMove[]>([]);
  const [aiNodes, setAiNodes] = useState(0);
  const [aiElapsed, setAiElapsed] = useState(0);
  const [aiNps, setAiNps] = useState(0);
  const [aiDepthReached, setAiDepthReached] = useState<number | null>(null);
  const [aiBusyElapsedMs, setAiBusyElapsedMs] = useState(0);
  const [aiTTProbes, setAiTTProbes] = useState(0);
  const [aiTTHits, setAiTTHits] = useState(0);
  const [aiCutoffs, setAiCutoffs] = useState(0);
  const [aiPvsReSearches, setAiPvsReSearches] = useState(0);
  const [aiLmrReductions, setAiLmrReductions] = useState(0);

  // Worker infra
  const workerRef = useRef<Worker | null>(null);
  const searchIdRef = useRef(0);
  const latestStateRef = useRef(state);
  useEffect(() => { latestStateRef.current = state; }, [state]);

  // Worker pool for root-split parallelism (auto mode)
  const poolRef = useRef<WorkerPool | null>(null);
  useEffect(() => {
    try { poolRef.current = createWorkerPool(); } catch {}
    return () => {
      try { poolRef.current?.dispose(); } catch {}
      poolRef.current = null;
    };
  }, []);

  // Pending timers for delayed AI merge after visual selection
  const pendingMergeTimerRef = useRef<number | null>(null);
  const pendingMergeRafRef = useRef<number | null>(null);

  const clearPendingMergeTimers = () => {
    if (pendingMergeTimerRef.current != null) {
      clearTimeout(pendingMergeTimerRef.current);
      pendingMergeTimerRef.current = null;
    }
    if (pendingMergeRafRef.current != null) {
      cancelAnimationFrame(pendingMergeRafRef.current);
      pendingMergeRafRef.current = null;
    }
  };

  const scheduleAiAttemptMerge = (mv: AIMove) => {
    const st = latestStateRef.current;
    // Visual selection like a human
    dispatch({ type: 'select', id: (mv as any).sourceId });
    // Determine delay based on mode
    const delayMs = st.mode !== 'simulation' ? 1000 : 0;
    clearPendingMergeTimers();
    const perform = () => {
      const st2 = latestStateRef.current;
      // Re-check guards right before merging
      const animationBlocking = (!!st2.mergeFx) && (st2.mode !== 'simulation');
      if (animationBlocking || st2.roundOver || st2.gameOver) {
        // Give up this attempt; controller will naturally retry later via autoplay if applicable
        setAiBusy(false);
        return;
      }
      dispatch({ type: 'attempt-merge', sourceId: (mv as any).sourceId, targetId: (mv as any).targetId });
      setAiBusy(false);
    };
    if (delayMs > 0) {
      pendingMergeTimerRef.current = window.setTimeout(perform, delayMs);
    } else {
      // Ensure selection renders at least a frame before merging
      pendingMergeRafRef.current = requestAnimationFrame(() => {
        pendingMergeTimerRef.current = window.setTimeout(perform, 0);
      });
    }
  };

  // Create worker once; use latestStateRef to avoid stale closures
  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('../ia/worker/aiWorker.ts', import.meta.url), { type: 'module' });
      const w = workerRef.current;
      w.onmessage = (e: MessageEvent) => {
        const data = e.data || {};
        if (typeof data.searchId === 'number' && data.searchId !== searchIdRef.current) {
          return; // stale
        }
        if (data.type === 'PROGRESS') {
          setAiProgress({ depth: data.depth ?? 0, score: data.score ?? 0 });
          if (typeof data.nodes === 'number') setAiNodes(data.nodes);
          if (typeof data.ttProbes === 'number') setAiTTProbes(data.ttProbes);
          if (typeof data.ttHits === 'number') setAiTTHits(data.ttHits);
          if (typeof data.cutoffs === 'number') setAiCutoffs(data.cutoffs);
          if (typeof data.pvsReSearches === 'number') setAiPvsReSearches(data.pvsReSearches);
          if (typeof data.lmrReductions === 'number') setAiLmrReductions(data.lmrReductions);
        } else if (data.type === 'RESULT') {
          setAiEval(data.score ?? null);
          setAiDepthReached(data.depthReached ?? null);
          setAiPV(data.pv ?? []);
          setAiRootMoves(data.rootMoves ?? []);
          setAiNodes(data.nodes ?? 0);
          setAiElapsed(data.elapsedMs ?? 0);
          setAiNps(data.nps ?? 0);
          if (typeof data.ttProbes === 'number') setAiTTProbes(data.ttProbes);
          if (typeof data.ttHits === 'number') setAiTTHits(data.ttHits);
          if (typeof data.cutoffs === 'number') setAiCutoffs(data.cutoffs);
          if (typeof data.pvsReSearches === 'number') setAiPvsReSearches(data.pvsReSearches);
          if (typeof data.lmrReductions === 'number') setAiLmrReductions(data.lmrReductions);
          setAiProgress(null);
          if (typeof data.elapsedMs === 'number') setAiBusyElapsedMs(data.elapsedMs);
          const mv = data.bestMove as AIMove | undefined;
          const st = latestStateRef.current;
          // If an animation is running in normal mode, skip applying the move now; autoplay will retry after animation clears
          const animationBlocking = (!!st.mergeFx) && (st.mode !== 'simulation');
          if (mv && (mv as any).sourceId && (mv as any).targetId && !st.roundOver && !st.gameOver && !animationBlocking) {
            // Keep busy until the delayed merge is dispatched
            scheduleAiAttemptMerge(mv);
          } else {
            setAiBusy(false);
          }
        }
      };
    } catch (err) {
      console.warn('AI Worker no disponible. Fallback al hilo principal.', err);
    }
    return () => {
      try {
        workerRef.current?.postMessage({ type: 'CANCEL' });
        workerRef.current?.terminate();
      } catch {}
      workerRef.current = null;
    };
  }, [dispatch]);

  // Busy live timer
  useEffect(() => {
    if (!aiBusy) return;
    const start = performance.now();
    setAiBusyElapsedMs(0);
    const id = setInterval(() => setAiBusyElapsedMs(performance.now() - start), 120);
    return () => clearInterval(id);
  }, [aiBusy]);

  const cancel = useCallback(() => {
    try { workerRef.current?.postMessage({ type: 'CANCEL' }); } catch {}
    try { poolRef.current?.cancel(); } catch {}
    clearPendingMergeTimers();
    setAiBusy(false);
  }, []);

  const doAIMove = useCallback(() => {
    const st = latestStateRef.current;
    if (aiBusy) return;
    if (st.roundOver || st.gameOver) return;
    // In normal mode, wait until merge animation finishes
    if (st.mode !== 'simulation' && st.mergeFx) return;
    setAiBusy(true);
    setAiProgress(null);
    setAiDepthReached(null);
    setAiBusyElapsedMs(0);
    searchIdRef.current += 1;
    const searchId = searchIdRef.current;

    // Build search options once
    const options = {
      enableTT: aiEnableTT,
      failSoft: aiFailSoft,
      preferHashMove: aiPreferHashMove,
      enableKillers: aiEnableKillers,
      enableHistory: aiEnableHistory,
      enablePVS: aiEnablePVS,
      enableAspiration: aiEnableAspiration,
      aspirationDelta: aiAspirationDelta,
      enableQuiescence: aiEnableQuiescence,
      quiescenceDepth: aiQuiescenceDepth,
      quiescenceHighTowerThreshold: aiQuiescenceHighTowerThreshold,
      enableLMR: true,
      lmrMinDepth: 3,
      lmrLateMoveIdx: 4,
      lmrReduction: 1,
    } as const;

    // Precompute time/adaptive config to avoid control-flow narrowing issues
    const isManual = aiTimeMode === 'manual';
    const isAuto = aiTimeMode === 'auto';
    const requestedTimeMs = isManual ? Math.max(50, Math.floor(aiTimeSeconds * 1000)) : undefined;
    const adaptiveConfig = isAuto ? {
      minMs: aiTimeMinMs,
      maxMs: aiTimeMaxMs,
      baseMs: aiTimeBaseMs,
      perMoveMs: aiTimePerMoveMs,
      exponent: aiTimeExponent,
    } : undefined;

    // Prefer parallel root search via pool in auto mode
    const pool = poolRef.current;
    if (pool && isAuto) {
      try { pool.cancel(); } catch {}
      setTimeout(() => {
        pool
          .searchRoot(st, aiDepth, options, undefined, (p) => {
            if (typeof p.nodes === 'number') setAiNodes(p.nodes);
            if (typeof p.ttProbes === 'number') setAiTTProbes(p.ttProbes);
            if (typeof p.ttHits === 'number') setAiTTHits(p.ttHits);
            if (typeof p.cutoffs === 'number') setAiCutoffs(p.cutoffs);
            if (typeof p.pvsReSearches === 'number') setAiPvsReSearches(p.pvsReSearches);
            if (typeof p.lmrReductions === 'number') setAiLmrReductions(p.lmrReductions);
          })
          .then((res) => {
            setAiEval(res.score ?? null);
            setAiDepthReached(res.depthReached ?? null);
            setAiPV(res.pv ?? []);
            setAiRootMoves(res.rootMoves ?? []);
            setAiNodes(res.nodes ?? 0);
            setAiElapsed(res.elapsedMs ?? 0);
            setAiNps(res.nps ?? 0);
            if (typeof res.ttProbes === 'number') setAiTTProbes(res.ttProbes);
            if (typeof res.ttHits === 'number') setAiTTHits(res.ttHits);
            if (typeof res.cutoffs === 'number') setAiCutoffs(res.cutoffs);
            if (typeof res.pvsReSearches === 'number') setAiPvsReSearches(res.pvsReSearches);
            if (typeof res.lmrReductions === 'number') setAiLmrReductions(res.lmrReductions);
            setAiProgress(null);
            if (typeof res.elapsedMs === 'number') setAiBusyElapsedMs(res.elapsedMs);
            const mv = res.bestMove as AIMove | undefined;
            const st2 = latestStateRef.current;
            const animationBlocking = (!!st2.mergeFx) && (st2.mode !== 'simulation');
            if (mv && (mv as any).sourceId && (mv as any).targetId && !st2.roundOver && !st2.gameOver && !animationBlocking) {
              scheduleAiAttemptMerge(mv);
            } else {
              setAiBusy(false);
            }
          })
          .catch((err) => {
            console.warn('Pool search failed, falling back to worker.', err);
            // Fallback to single-worker path below
            const w2 = workerRef.current;
            if (w2) {
              try { w2.postMessage({ type: 'CANCEL' }); } catch {}
              try {
                w2.postMessage({
                  type: 'SEARCH',
                  state: st,
                  depth: aiDepth,
                  timeMs: requestedTimeMs,
                  options,
                  adaptiveTimeConfig: adaptiveConfig,
                  searchId,
                });
              } catch (err2) {
                console.warn('Fallo postMessage al worker. Fallback al hilo principal.', err2);
                const res = bestMove(st, aiDepth);
                setAiEval(res.score ?? null);
                setAiPV(res.pv ?? []);
                setAiRootMoves(res.rootMoves ?? []);
                setAiNodes(res.nodes ?? 0);
                setAiElapsed(res.elapsedMs ?? 0);
                setAiNps(res.nps ?? 0);
                setAiDepthReached(null);
                setAiBusyElapsedMs(res.elapsedMs ?? 0);
                const st3 = latestStateRef.current;
                const animationBlocking = (!!st3.mergeFx) && (st3.mode !== 'simulation');
                if (res.move && !animationBlocking && !st3.roundOver && !st3.gameOver) {
                  scheduleAiAttemptMerge(res.move);
                } else {
                  setAiBusy(false);
                }
              }
            } else {
              const res = bestMove(st, aiDepth);
              setAiEval(res.score ?? null);
              setAiPV(res.pv ?? []);
              setAiRootMoves(res.rootMoves ?? []);
              setAiNodes(res.nodes ?? 0);
              setAiElapsed(res.elapsedMs ?? 0);
              setAiNps(res.nps ?? 0);
              setAiDepthReached(null);
              setAiBusyElapsedMs(res.elapsedMs ?? 0);
              const st3 = latestStateRef.current;
              const animationBlocking = (!!st3.mergeFx) && (st3.mode !== 'simulation');
              if (res.move && !animationBlocking && !st3.roundOver && !st3.gameOver) {
                scheduleAiAttemptMerge(res.move);
              } else {
                setAiBusy(false);
              }
            }
          });
      }, 0);
      return;
    }

    const w = workerRef.current;
    if (w) {
      try { w.postMessage({ type: 'CANCEL' }); } catch {}
      setTimeout(() => {
        try {
          w.postMessage({
            type: 'SEARCH',
            state: st,
            depth: aiDepth,
            timeMs: requestedTimeMs,
            options,
            adaptiveTimeConfig: adaptiveConfig,
            searchId,
          });
        } catch (err) {
          console.warn('Fallo postMessage al worker. Fallback al hilo principal.', err);
          const res = bestMove(st, aiDepth);
          setAiEval(res.score ?? null);
          setAiPV(res.pv ?? []);
          setAiRootMoves(res.rootMoves ?? []);
          setAiNodes(res.nodes ?? 0);
          setAiElapsed(res.elapsedMs ?? 0);
          setAiNps(res.nps ?? 0);
          setAiDepthReached(null);
          setAiBusyElapsedMs(res.elapsedMs ?? 0);
          const st2 = latestStateRef.current;
          const animationBlocking = (!!st2.mergeFx) && (st2.mode !== 'simulation');
          if (res.move && !animationBlocking && !st2.roundOver && !st2.gameOver) {
            scheduleAiAttemptMerge(res.move);
          } else {
            setAiBusy(false);
          }
        }
      }, 0);
      return;
    }

    // Fallback (no worker)
    const res = bestMove(st, aiDepth);
    setAiEval(res.score ?? null);
    setAiPV(res.pv ?? []);
    setAiRootMoves(res.rootMoves ?? []);
    setAiNodes(res.nodes ?? 0);
    setAiElapsed(res.elapsedMs ?? 0);
    setAiNps(res.nps ?? 0);
    setAiDepthReached(null);
    setAiBusyElapsedMs(res.elapsedMs ?? 0);
    const st3 = latestStateRef.current;
    const animationBlocking = (!!st3.mergeFx) && (st3.mode !== 'simulation');
    if (res.move && !animationBlocking && !st3.roundOver && !st3.gameOver) {
      scheduleAiAttemptMerge(res.move);
    } else {
      setAiBusy(false);
    }
  }, [aiBusy, aiDepth, aiTimeMode, aiTimeSeconds, dispatch]);

  // Autoplay: active if global autoplay OR current player's control toggle is on
  useEffect(() => {
    const currentToggle = latestStateRef.current.currentPlayer === 1 ? aiControlP1 : aiControlP2;
    const shouldAuto = aiAutoplay || currentToggle;
    if (!shouldAuto) return;
    if (aiBusy) return;
    if (state.roundOver || state.gameOver) return;
    // In normal mode, do not autoplay while merge animation is running
    if (state.mode !== 'simulation' && state.mergeFx) return;
    const t = setTimeout(() => { doAIMove(); }, aiTimeMode === 'manual' ? Math.max(0, Math.floor(aiTimeSeconds * 1000)) : 0);
    return () => clearTimeout(t);
  }, [aiAutoplay, aiControlP1, aiControlP2, aiBusy, aiTimeMode, aiTimeSeconds, state.roundOver, state.gameOver, state.currentPlayer, state.mergeFx, state.mode, doAIMove]);

  // Cleanup on unmount: cancel timers
  useEffect(() => {
    return () => {
      clearPendingMergeTimers();
    };
  }, []);

  return {
    aiDepth, setAiDepth,
    aiTimeMode, setAiTimeMode,
    aiTimeSeconds, setAiTimeSeconds,
    aiAutoplay, setAiAutoplay,
    aiControlP1, setAiControlP1,
    aiControlP2, setAiControlP2,
    aiEnableTT, setAiEnableTT,
    aiFailSoft, setAiFailSoft,
    aiPreferHashMove, setAiPreferHashMove,
    aiEnableKillers, setAiEnableKillers,
    aiEnableHistory, setAiEnableHistory,
    aiEnablePVS, setAiEnablePVS,
    aiEnableAspiration, setAiEnableAspiration,
    aiAspirationDelta, setAiAspirationDelta,
    aiEnableQuiescence, setAiEnableQuiescence,
    aiQuiescenceDepth, setAiQuiescenceDepth,
    aiQuiescenceHighTowerThreshold, setAiQuiescenceHighTowerThreshold,

    aiTimeMinMs, setAiTimeMinMs,
    aiTimeMaxMs, setAiTimeMaxMs,
    aiTimeBaseMs, setAiTimeBaseMs,
    aiTimePerMoveMs, setAiTimePerMoveMs,
    aiTimeExponent, setAiTimeExponent,

    aiBusy, aiProgress, aiBusyElapsedMs,

    aiEval, aiPV, aiRootMoves, aiNodes, aiElapsed, aiNps, aiDepthReached,
    aiTTProbes, aiTTHits, aiCutoffs, aiPvsReSearches, aiLmrReductions,

    doAIMove, cancel,
  };
}
