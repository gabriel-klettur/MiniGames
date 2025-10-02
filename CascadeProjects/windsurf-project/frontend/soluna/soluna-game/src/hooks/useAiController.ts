import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react';
import { bestMove, type AIMove } from '../ia';
import type { GameAction, GameState } from '../game/types';

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

  // Worker infra
  const workerRef = useRef<Worker | null>(null);
  const searchIdRef = useRef(0);
  const latestStateRef = useRef(state);
  useEffect(() => { latestStateRef.current = state; }, [state]);

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
        } else if (data.type === 'RESULT') {
          setAiEval(data.score ?? null);
          setAiDepthReached(data.depthReached ?? null);
          setAiPV(data.pv ?? []);
          setAiRootMoves(data.rootMoves ?? []);
          setAiNodes(data.nodes ?? 0);
          setAiElapsed(data.elapsedMs ?? 0);
          setAiNps(data.nps ?? 0);
          setAiProgress(null);
          setAiBusy(false);
          if (typeof data.elapsedMs === 'number') setAiBusyElapsedMs(data.elapsedMs);
          const mv = data.bestMove as AIMove | undefined;
          const st = latestStateRef.current;
          if (mv && (mv as any).sourceId && (mv as any).targetId && !st.roundOver && !st.gameOver) {
            dispatch({ type: 'select', id: (mv as any).sourceId });
            dispatch({ type: 'attempt-merge', targetId: (mv as any).targetId });
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
  }, []);

  const doAIMove = useCallback(() => {
    const st = latestStateRef.current;
    if (aiBusy) return;
    if (st.roundOver || st.gameOver) return;
    setAiBusy(true);
    setAiProgress(null);
    setAiDepthReached(null);
    setAiBusyElapsedMs(0);
    searchIdRef.current += 1;
    const searchId = searchIdRef.current;

    const w = workerRef.current;
    if (w) {
      try { w.postMessage({ type: 'CANCEL' }); } catch {}
      setTimeout(() => {
        try {
          w.postMessage({
            type: 'SEARCH',
            state: st,
            depth: aiDepth,
            timeMs: aiTimeMode === 'manual' ? Math.max(50, Math.floor(aiTimeSeconds * 1000)) : undefined,
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
          setAiBusy(false);
          setAiBusyElapsedMs(res.elapsedMs ?? 0);
          if (res.move) {
            dispatch({ type: 'select', id: (res.move as any).sourceId });
            dispatch({ type: 'attempt-merge', targetId: (res.move as any).targetId });
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
    setAiBusy(false);
    setAiBusyElapsedMs(res.elapsedMs ?? 0);
    if (res.move) {
      dispatch({ type: 'select', id: (res.move as any).sourceId });
      dispatch({ type: 'attempt-merge', targetId: (res.move as any).targetId });
    }
  }, [aiBusy, aiDepth, aiTimeMode, aiTimeSeconds, dispatch]);

  // Autoplay
  useEffect(() => {
    if (!aiAutoplay) return;
    if (aiBusy) return;
    if (state.roundOver || state.gameOver) return;
    const t = setTimeout(() => { doAIMove(); }, aiTimeMode === 'manual' ? Math.max(0, Math.floor(aiTimeSeconds * 1000)) : 0);
    return () => clearTimeout(t);
  }, [aiAutoplay, aiBusy, aiTimeMode, aiTimeSeconds, state.roundOver, state.gameOver, state.currentPlayer, doAIMove]);

  return {
    aiDepth, setAiDepth,
    aiTimeMode, setAiTimeMode,
    aiTimeSeconds, setAiTimeSeconds,
    aiAutoplay, setAiAutoplay,

    aiBusy, aiProgress, aiBusyElapsedMs,

    aiEval, aiPV, aiRootMoves, aiNodes, aiElapsed, aiNps, aiDepthReached,

    doAIMove, cancel,
  };
}
