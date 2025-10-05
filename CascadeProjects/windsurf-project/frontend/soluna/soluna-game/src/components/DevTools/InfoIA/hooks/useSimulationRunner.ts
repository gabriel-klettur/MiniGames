import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../../../../game/store';
import { bestMove } from '../../../../ia';
import type { GameState } from '../../../../game/types';
import type { MoveDetail, TimeMode, InfoIARecord } from '../types';
import { createAIRunner } from '../services/aiRunner';
const DRAFT_KEY = 'soluna.infoia.records.current.v1';

export interface SimulationSettings {
  setsCount: number;
  p1Depth: number;
  p2Depth: number;
  p1Mode: TimeMode;
  p2Mode: TimeMode;
  p1Secs: number;
  p2Secs: number;
  vizRef: React.MutableRefObject<boolean>;
  // Engine flags
  enableTT: boolean;
  failSoft: boolean;
  preferHashMove: boolean;
  enableKillers: boolean;
  enableHistory: boolean;
  enablePVS: boolean;
  enableAspiration: boolean;
  aspirationDelta: number;
}

export interface SimulationMetrics {
  moveIndex: number;
  moveElapsedMs: number;
  moveTargetMs?: number;
  progDepth: number;
  progNodes: number;
  progScore: number;
  progNps: number;
}

export interface UseSimulationRunner extends SimulationMetrics {
  running: boolean;
  start: () => void;
  stop: () => void;
  runningRef: React.MutableRefObject<boolean>;
}

export function useSimulationRunner(
  settings: SimulationSettings,
  addRecord: (rec: InfoIARecord) => void,
  getState?: () => GameState,
): UseSimulationRunner {
  const { dispatch } = useGame();

  // Running state & refs
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

  // Move timers/raf
  const moveRafRef = useRef<number | null>(null);

  // External runner (e.g., worker-backed search)
  const runnerRef = useRef<ReturnType<typeof createAIRunner> | null>(null);

  // Metrics
  const [moveIndex, setMoveIndex] = useState(0);
  const [moveElapsedMs, setMoveElapsedMs] = useState(0);
  const [moveTargetMs, setMoveTargetMs] = useState<number | undefined>(undefined);
  const [progDepth, setProgDepth] = useState(0);
  const [progNodes, setProgNodes] = useState(0);
  const [progScore, setProgScore] = useState(0);
  const [progNps, setProgNps] = useState(0);
  const moveStartRef = useRef<number>(0);

  // Game state resolver (container may pass a getter to avoid frequent re-renders)
  const resolveState = () => (getState ? getState() : ({} as GameState));

  // Create/cleanup runner once
  useEffect(() => {
    runnerRef.current = createAIRunner();
    return () => {
      try { runnerRef.current?.dispose(); } catch {}
      runnerRef.current = null;
    };
  }, []);

  const stopMoveRaf = () => {
    if (moveRafRef.current != null) {
      cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = null;
    }
  };

  const waitTurnOrEnd = async (prevPlayer: 1 | 2): Promise<boolean> => {
    for (let tries = 0; tries < 60 && runningRef.current; tries++) {
      await new Promise((r) => setTimeout(r, 0));
      const sNow = resolveState();
      if (sNow.roundOver || sNow.gameOver) return true;
      if (sNow.currentPlayer !== prevPlayer) return true;
    }
    return false;
  };

  const run = useCallback(async () => {
    runningRef.current = true;
    setRunning(true);
    dispatch({ type: 'set-mode', mode: 'simulation' } as any);

    // We obtain a fresh store reference on every start to keep stateRef updated during run
    // This assumes that the parent container updates stateRef.current on game state changes.

    let setsPlayed = 0;
    for (let s = 0; setsPlayed < settings.setsCount && runningRef.current; s++) {
      // Reset game for a new set
      dispatch({ type: 'reset-game' });
      dispatch({ type: 'set-mode', mode: 'simulation' } as any);

      // Wait for reset to apply (no stars, not over)
      const ok = await (async () => {
        for (let tries = 0; tries < 60 && runningRef.current; tries++) {
          await new Promise((r) => setTimeout(r, 0));
          const sNow: any = resolveState();
          const stars1 = sNow?.players?.[1]?.stars ?? 0;
          const stars2 = sNow?.players?.[2]?.stars ?? 0;
          if (!sNow.gameOver && !sNow.roundOver && stars1 === 0 && stars2 === 0) return true;
        }
        return false;
      })();
      if (!ok) break;

      let roundsInSet = 0;
      while (runningRef.current && !resolveState().gameOver) {
        const startedAtWall = Date.now();
        const t0 = performance.now();
        let moves = 0;
        const curDetails: MoveDetail[] = [];
        // Stable id for this round to match draft and final record
        const recordId = `${startedAtWall}-${setsPlayed}-${roundsInSet}`;

        // Iterate moves until the round/game ends (no fixed plies limit)
        for (let p = 0; runningRef.current; p++) {
          const stNow = resolveState();
          const cur = stNow.currentPlayer as 1 | 2;
          const depth = cur === 1 ? settings.p1Depth : settings.p2Depth;
          const mode = cur === 1 ? settings.p1Mode : settings.p2Mode;
          const secs = cur === 1 ? settings.p1Secs : settings.p2Secs;
          const target = mode === 'manual' ? Math.max(0, Math.floor(secs * 1000)) : 0;

          setMoveIndex(p + 1);
          setMoveElapsedMs(0);
          setMoveTargetMs(target || undefined);
          setProgDepth(0); setProgNodes(0); setProgScore(0); setProgNps(0);

          // Progress timer via RAF (only visual)
          stopMoveRaf();
          try {
            moveStartRef.current = performance.now();
            if (settings.vizRef.current) {
              const tick = () => {
                const elapsed = performance.now() - moveStartRef.current;
                setMoveElapsedMs(elapsed);
                if ((target === 0 || elapsed < target) && runningRef.current) {
                  moveRafRef.current = requestAnimationFrame(tick);
                }
              };
              moveRafRef.current = requestAnimationFrame(tick);
            }
          } catch {}

          // Search via runner, with fallback to bestMove
          const runner = runnerRef.current;
          try {
            let res: undefined | { bestMove?: any; elapsedMs?: number; depthReached?: number; nodes?: number; nps?: number; score?: number } = undefined;
            if (runner) {
              try {
                res = await runner.startSearch(
                  {
                    state: resolveState(),
                    depth,
                    timeMs: target || undefined,
                    options: {
                      enableTT: settings.enableTT,
                      failSoft: settings.failSoft,
                      preferHashMove: settings.preferHashMove,
                      enableKillers: settings.enableKillers,
                      enableHistory: settings.enableHistory,
                      enablePVS: settings.enablePVS,
                      enableAspiration: settings.enableAspiration,
                      aspirationDelta: settings.aspirationDelta,
                    },
                  },
                  (p) => {
                    if (!settings.vizRef.current) return;
                    setProgDepth(p.depth || 0);
                    setProgNodes(p.nodes || 0);
                    setProgScore(typeof p.score === 'number' ? p.score : 0);
                    // Estimate NPS based on elapsed time in this move using moveStartRef
                    const now = performance.now();
                    const elapsed = Math.max(1, now - moveStartRef.current);
                    setProgNps(Math.round(((p.nodes || 0) * 1000) / elapsed));
                  }
                );
              } catch {
                res = undefined;
              }
            }

            stopMoveRaf();
            setMoveElapsedMs(res?.elapsedMs ?? (target || 0));

            if (res?.bestMove) {
              const mv: any = res.bestMove;
              dispatch({ type: 'select', id: mv.sourceId });
              dispatch({ type: 'attempt-merge', sourceId: mv.sourceId, targetId: mv.targetId });
              const applied = await waitTurnOrEnd(cur);
              if (applied) {
                curDetails.push({
                  index: curDetails.length + 1,
                  elapsedMs: res?.elapsedMs ?? target ?? 0,
                  depthReached: res?.depthReached,
                  nodes: res?.nodes,
                  nps: res?.nps,
                  score: res?.score,
                  bestMove: mv,
                  player: cur,
                  depthUsed: depth,
                  applied: true,
                  at: Date.now(),
                });
                moves++;
                // Persist draft after each applied move
                try {
                  const draft: InfoIARecord = {
                    id: recordId,
                    startedAt: startedAtWall,
                    durationMs: performance.now() - t0,
                    moves,
                    winner: 0,
                    p1Depth: settings.p1Depth,
                    p2Depth: settings.p2Depth,
                    setId: `set-${setsPlayed}`,
                    details: curDetails,
                  };
                  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                } catch {}
              }
            } else {
              // Fallback
              const fb: any = (bestMove as any)(resolveState(), depth);
              if (fb?.move) {
                dispatch({ type: 'select', id: fb.move.sourceId });
                dispatch({ type: 'attempt-merge', sourceId: fb.move.sourceId, targetId: fb.move.targetId });
              }
              const applied = await waitTurnOrEnd(cur);
              if (applied) {
                curDetails.push({
                  index: curDetails.length + 1,
                  elapsedMs: fb?.elapsedMs ?? target ?? 0,
                  nodes: fb?.nodes,
                  nps: fb?.nps,
                  score: fb?.score,
                  bestMove: fb?.move,
                  player: cur,
                  depthUsed: depth,
                  applied: true,
                  at: Date.now(),
                });
                moves++;
                // Persist draft after each applied move
                try {
                  const draft: InfoIARecord = {
                    id: recordId,
                    startedAt: startedAtWall,
                    durationMs: performance.now() - t0,
                    moves,
                    winner: 0,
                    p1Depth: settings.p1Depth,
                    p2Depth: settings.p2Depth,
                    setId: `set-${setsPlayed}`,
                    details: curDetails,
                  };
                  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                } catch {}
              }
            }
          } catch {}

          await new Promise((r) => setTimeout(r, 0));
          const stPost = resolveState();
          if (stPost.roundOver || stPost.gameOver) break;
        }

        const stEnd = resolveState();
        const t1 = performance.now();
        addRecord({
          id: recordId,
          startedAt: startedAtWall,
          durationMs: t1 - t0,
          moves,
          winner: stEnd.roundOver ? (stEnd.lastMover as 1 | 2) : 0,
          p1Depth: settings.p1Depth,
          p2Depth: settings.p2Depth,
          setId: `set-${setsPlayed}`,
          details: curDetails,
        });
        // Clear draft once finalized
        try { localStorage.removeItem(DRAFT_KEY); } catch {}

        roundsInSet += 1;
        if (stEnd.roundOver && !stEnd.gameOver) {
          dispatch({ type: 'new-round' });
        }
        await new Promise((r) => setTimeout(r, 0));
        if (roundsInSet > 50) break; // safety guard
      }

      setsPlayed += 1;
    }

    runningRef.current = false;
    setRunning(false);
    dispatch({ type: 'set-mode', mode: 'normal' } as any);
  }, [addRecord, dispatch, settings]);

  const start = useCallback(() => {
    if (runningRef.current) return;
    void run();
  }, [run]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    stopMoveRaf();
    try { runnerRef.current?.cancel(); } catch {}
  }, []);

  return {
    running,
    start,
    stop,
    runningRef,
    moveIndex,
    moveElapsedMs,
    moveTargetMs,
    progDepth,
    progNodes,
    progScore,
    progNps,
  };
}
