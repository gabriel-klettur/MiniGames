import { useCallback, useEffect, useRef, useState } from 'react';
import type { InfoIARecord, MoveDetail, TimeMode } from '../types';
import { createInitialState } from '../../../../game/pieces';
import { movePiece as applyMoveRules } from '../../../../game/rules';
import type { GameState, Player } from '../../../../game/types';
import { createAIRunner } from '../services/aiRunner';
import type { EvalParams } from '../../../../ia/evalTypes';
import type { EngineOptions, SearchStats } from '../../../../ia/search/types';
import { findBestMoveRootParallel, type SearchEvent } from '../../../../ia/search';
import { hashState } from '../../../../ia/hash';
import { generateMoves } from '../../../../ia/moves';

export interface SimulationSettings {
  gamesCount: number;
  p1Depth: number;
  p2Depth: number;
  p1Mode: TimeMode;
  p2Mode: TimeMode;
  p1Secs: number;
  p2Secs: number;
  vizRef: React.MutableRefObject<boolean>;
  suspendPersistence: boolean;
  // Optional per-player engine options
  p1Options?: EngineOptions;
  p2Options?: EngineOptions;
  // Optional per-player evaluation weights
  p1Eval?: EvalParams;
  p2Eval?: EvalParams;
  // Global execution options
  useRootParallel?: boolean;
  workers?: number;
  // Starting player eligibility per game (per player)
  startEligibleLight?: boolean;
  startEligibleDark?: boolean;
  // Number of initial plies to play randomly (opening randomization)
  randomOpeningPlies?: number;
  // Collect per-move heuristics summary when available
  traceHeuristics?: boolean;
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
): UseSimulationRunner {
  // Running state & refs
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

  // Move timers/raf
  const moveRafRef = useRef<number | null>(null);
  const moveStartRef = useRef<number>(0);
  const moveNodesMaxRef = useRef<number>(0);

  // External runner (worker-backed search)
  const runnerRef = useRef<ReturnType<typeof createAIRunner> | null>(null);

  // Metrics
  const [moveIndex, setMoveIndex] = useState(0);
  const [moveElapsedMs, setMoveElapsedMs] = useState(0);
  const [moveTargetMs, setMoveTargetMs] = useState<number | undefined>(undefined);
  const [progDepth, setProgDepth] = useState(0);
  const [progNodes, setProgNodes] = useState(0);
  const [progScore, setProgScore] = useState(0);
  const [progNps, setProgNps] = useState(0);

  const stopMoveRaf = () => {
    if (moveRafRef.current != null) {
      cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = null;
    }
  };

  // Create/cleanup runner once
  useEffect(() => {
    runnerRef.current = createAIRunner();
    return () => { try { runnerRef.current?.dispose(); } catch {}; runnerRef.current = null; };
  }, []);

  const computeTimeBudget = (mode: TimeMode, secs: number): number => {
    if (mode === 'manual') {
      const v = Math.max(0, Math.min(60, Math.round(secs)));
      return v === 0 ? Infinity : v * 1000;
    }
    // Auto: unlimited budget (engine decides when to stop). UI HUD will show no target.
    return Infinity;
  };

  const run = useCallback(async () => {
    runningRef.current = true;
    setRunning(true);

    for (let g = 0; g < Math.max(1, settings.gamesCount) && runningRef.current; g++) {
      // Local state por partida
      let gs: GameState = createInitialState();
      try {
        const allowLight = settings.startEligibleLight !== false;
        const allowDark = settings.startEligibleDark !== false;
        if (allowLight || allowDark) {
          if (allowLight && allowDark) {
            gs.turn = (Math.random() < 0.5 ? 'Light' : 'Dark') as Player;
          } else if (allowLight) {
            gs.turn = 'Light';
          } else if (allowDark) {
            gs.turn = 'Dark';
          }
        }
      } catch {}
      let moves = 0;
      const curDetails: MoveDetail[] = [];
      const startedAtWall = Date.now();
      const t0 = performance.now();
      setMoveIndex(0); setMoveElapsedMs(0); setMoveTargetMs(undefined);

      // Loop until winner
      while (!gs.winner && runningRef.current) {
        const cur: Player = gs.turn;
        const isP1 = cur === 'Light';
        const depth = isP1 ? settings.p1Depth : settings.p2Depth;
        const mode = isP1 ? settings.p1Mode : settings.p2Mode;
        const secs = isP1 ? settings.p1Secs : settings.p2Secs;
        const target = computeTimeBudget(mode, secs);
        const engine: EngineOptions | undefined = isP1 ? settings.p1Options : settings.p2Options;
        const engineWithWorkers: EngineOptions | undefined = engine ? { ...engine, workers: settings.workers } : { workers: settings.workers } as any;

        // Inject per-player evaluation weights into state for evaluate()
        try {
          const lightEval: EvalParams | undefined = settings.p1Eval;
          const darkEval: EvalParams | undefined = settings.p2Eval;
          if (gs.ai) {
            const ew: any = (gs.ai.evalWeights ||= {} as any);
            if (lightEval) ew['Light'] = { ...(ew['Light'] || {}), ...lightEval };
            if (darkEval) ew['Dark'] = { ...(ew['Dark'] || {}), ...darkEval };
          }
        } catch {}

        setMoveIndex((v) => v + 1);
        setMoveElapsedMs(0);
        setMoveTargetMs(Number.isFinite(target) ? target : undefined);
        setProgDepth(0); setProgNodes(0); setProgScore(0); setProgNps(0);
        moveNodesMaxRef.current = 0;

        // Opening randomization: play a random legal move for the first N plies, if configured
        const openingLeft = Math.max(0, (settings.randomOpeningPlies ?? 0) - moves);
        if (openingLeft > 0) {
          const legal = generateMoves(gs);
          if (legal.length === 0) break;
          const rand = legal[Math.floor(Math.random() * legal.length)];
          const tStart = performance.now();
          applyMoveRules(gs, rand);
          const zKey = Number(hashState(gs) & (0xffff_ffffn));
          const actualElapsed = performance.now() - tStart;
          curDetails.push({
            index: curDetails.length + 1,
            elapsedMs: actualElapsed,
            nodes: 0,
            nps: 0,
            bestMove: rand,
            player: cur,
            depthUsed: 0,
            applied: true,
            at: Date.now(),
            zKey,
          });
          moves++;
          // Yield to UI
          await new Promise((r) => setTimeout(r, 0));
          continue;
        }

        stopMoveRaf();
        try {
          moveStartRef.current = performance.now();
          if (settings.vizRef.current) {
            const tick = () => {
              const elapsed = performance.now() - moveStartRef.current;
              setMoveElapsedMs(elapsed);
              if ((!Number.isFinite(target) || elapsed < target) && runningRef.current) {
                moveRafRef.current = requestAnimationFrame(tick);
              }
            };
            moveRafRef.current = requestAnimationFrame(tick);
          }
        } catch {}

        const runner = runnerRef.current!;
        try {
          const res = settings.useRootParallel
            ? await findBestMoveRootParallel(gs, {
                maxDepth: depth,
                timeLimitMs: target,
                engine: engineWithWorkers,
                onProgress: (ev: SearchEvent) => {
                  if (!settings.vizRef.current) return;
                  if (ev.type === 'iter') {
                    setProgDepth(ev.depth);
                    setProgScore(ev.score);
                  } else if (ev.type === 'progress') {
                    // Keep a monotonic aggregation of nodes across events/workers
                    moveNodesMaxRef.current = Math.max(moveNodesMaxRef.current, ev.nodesVisited);
                    setProgNodes(moveNodesMaxRef.current);
                    const now = performance.now();
                    const elapsed = Math.max(1, now - moveStartRef.current);
                    setProgNps(Math.round((moveNodesMaxRef.current * 1000) / elapsed));
                  } else if (ev.type === 'end') {
                    // At the end, we receive aggregated nodesVisited across workers
                    if (typeof ev.nodesVisited === 'number') {
                      moveNodesMaxRef.current = Math.max(moveNodesMaxRef.current, ev.nodesVisited);
                      setProgNodes(moveNodesMaxRef.current);
                      const now = performance.now();
                      const elapsed = Math.max(1, now - moveStartRef.current);
                      setProgNps(Math.round((moveNodesMaxRef.current * 1000) / elapsed));
                    }
                  }
                },
              })
            : await runner.startSearch(
                { state: gs, depth, timeMs: target, engine: engineWithWorkers },
                (p) => {
                  if (!settings.vizRef.current) return;
                  if (typeof p.depth === 'number') setProgDepth(p.depth);
                  if (typeof p.nodes === 'number') {
                    moveNodesMaxRef.current = Math.max(moveNodesMaxRef.current, p.nodes);
                    setProgNodes(moveNodesMaxRef.current);
                    const now = performance.now();
                    const elapsed = Math.max(1, now - moveStartRef.current);
                    setProgNps(Math.round((moveNodesMaxRef.current * 1000) / elapsed));
                  }
                  if (typeof p.score === 'number') setProgScore(p.score);
                }
              );

          stopMoveRaf();
          // Ensure we record the actual elapsed time even in Auto (Infinity) mode
          const actualElapsed = performance.now() - moveStartRef.current;
          setMoveElapsedMs(actualElapsed);

          const chosenMove = (res as any).bestMove ?? (res as any).moveId ?? null;
          if (chosenMove) {
            applyMoveRules(gs, chosenMove);
            const zKey = Number(hashState(gs) & (0xffff_ffffn));
            // Determine final nodes and nps for this move
            let finalNodes = moveNodesMaxRef.current;
            if (!finalNodes) {
              const maybeNodes = (res as any)?.nodes ?? (res as any)?.engineStats?.nodes;
              if (typeof maybeNodes === 'number') finalNodes = maybeNodes;
            }
            const finalNps = Math.round(finalNodes * 1000 / Math.max(1, actualElapsed));
            let explain: MoveDetail['explain'] | undefined = undefined;
            try {
              if ((res as any)?.engineStats) {
                const st = (res as any).engineStats as Partial<SearchStats>;
                explain = {
                  ttProbes: st.ttProbes,
                  ttHits: st.ttHits,
                  cutoffs: st.cutoffs,
                  pvsReSearches: st.pvsReSearches,
                  lmrReductions: st.lmrReductions,
                  aspReSearches: st.aspReSearches,
                  killersTried: st.killersTried,
                  historyUpdates: st.historyUpdates,
                  hashMoveUsed: (st.hashMoveUsed || 0) > 0,
                  qPlies: st.qPlies,
                  qNodes: st.qNodes,
                  lmpPrunes: st.lmpPrunes,
                  futilityPrunes: st.futilityPrunes,
                  iidProbes: st.iidProbes,
                  tbHits: (st as any).tbHits as any,
                } as any;
              }
            } catch {}
            curDetails.push({
              index: curDetails.length + 1,
              elapsedMs: actualElapsed,
              depthReached: res?.depthReached,
              nodes: finalNodes,
              nps: finalNps,
              score: res?.score,
              bestMove: chosenMove,
              player: cur,
              depthUsed: depth,
              applied: true,
              at: Date.now(),
              zKey,
              explain,
            });
            moves++;
          } else {
            // No move: likely terminal
            break;
          }
        } catch {
          stopMoveRaf();
          break;
        }

        // Yield to UI
        await new Promise((r) => setTimeout(r, 0));
      }

      const t1 = performance.now();
      // Compute simple per-game scores: number of retired pieces per player
      const p1Score = gs.pieces.filter((p) => p.owner === 'Light' && p.state === 'retirada').length;
      const p2Score = gs.pieces.filter((p) => p.owner === 'Dark' && p.state === 'retirada').length;
      addRecord({
        id: `${startedAtWall}-${g}`,
        startedAt: startedAtWall,
        durationMs: t1 - t0,
        moves,
        winner: (gs.winner as any) || 0,
        p1Depth: settings.p1Depth,
        p2Depth: settings.p2Depth,
        p1Score,
        p2Score,
        details: curDetails,
      });

      // Yield between games
      await new Promise((r) => setTimeout(r, 0));
    }

    runningRef.current = false;
    setRunning(false);
  }, [addRecord, settings]);

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

  return { running, start, stop, runningRef, moveIndex, moveElapsedMs, moveTargetMs, progDepth, progNodes, progScore, progNps };
}
