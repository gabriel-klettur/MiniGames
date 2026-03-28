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
import { computeFeatures } from '../../../../ia/evaluate';
import { updateWeights, DEFAULT_CLIP, predictScore } from '../../../../ia/autotune';

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
  // Epsilon-greedy exploration probability per move (post-opening)
  exploreEps?: number;
  // Collect per-move heuristics summary when available
  traceHeuristics?: boolean;
  // AutoTune (global)
  autoTuneEnabled?: boolean;
  autoTuneLr?: number;
  autoTuneReg?: number;
  autoTuneK?: number; // target magnitude for win/lose in points
  // Fraction of steps to reserve as holdout for validation (0..1)
  autoTuneHoldoutFrac?: number;
  // Robust objective selection and parameters
  autoTuneObjective?: 'mse' | 'huber' | 'logistic';
  autoTuneHuberDelta?: number;
  autoTuneLogisticK?: number;
  autoTuneGradClip?: number;
  // Early stopping and stabilization
  autoTunePatience?: number;    // steps/games without improvement before rollback
  autoTuneLrDecay?: number;     // factor to multiply lr on rollback (e.g., 0.5)
  autoTuneUseEMA?: boolean;     // use EMA weights when saving champion
  autoTuneEMABeta?: number;     // EMA blend for current weights (0..1), e.g., 0.1
  onTuneP1Eval?: (next: EvalParams) => void;
  onTuneP2Eval?: (next: EvalParams) => void;
  // AutoTune auto-save preset
  autoTuneAutoSave?: boolean;
  autoTuneSaveEvery?: number;
  onAutoSaveTunedPreset?: () => void;
  // AutoTune warmup/logging
  autoTuneWarmupPlies?: number;
  autoTuneLog?: boolean;
  // AutoTune per-side mask
  autoTuneTuneLight?: boolean;
  autoTuneTuneDark?: boolean;
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
  miniLadder: (games: number) => Promise<{ games: number; winsLight: number; winsDark: number; draws: number; wr: number }>;
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
  // AutoTune stabilization refs
  const lrRef = useRef<number | null>(null);
  const patienceRef = useRef<number>(0);
  const emaLightRef = useRef<EvalParams | null>(null);
  const emaDarkRef = useRef<EvalParams | null>(null);
  const championRef = useRef<{ wLight: EvalParams; wDark: EvalParams; metric: number; objective: 'mse'|'huber'|'logistic' } | null>(null);

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

  // Mini-ladder validation: run N self-play games with AutoTune disabled and no UI updates
  const miniLadder = useCallback(async (games: number) => {
    if (runningRef.current) throw new Error('Runner is busy');
    const total = Math.max(1, Math.round(games));
    let winsLight = 0, winsDark = 0, draws = 0;
    const runner = runnerRef.current!;
    for (let g = 0; g < total; g++) {
      let gs: GameState = createInitialState();
      // Alternate starting side for fairness
      try { gs.turn = (g % 2 === 0 ? 'Light' : 'Dark') as Player; } catch {}
      // Inject weights once; evaluate() reads from state.ai.evalWeights
      try {
        const lightEval: EvalParams | undefined = settings.p1Eval;
        const darkEval: EvalParams | undefined = settings.p2Eval;
        if ((gs as any).ai == null) { (gs as any).ai = {}; }
        const ew: any = (((gs as any).ai.evalWeights) ||= {} as any);
        if (lightEval) ew['Light'] = { ...(ew['Light'] || {}), ...lightEval };
        if (darkEval) ew['Dark'] = { ...(ew['Dark'] || {}), ...darkEval };
      } catch {}
      let moves = 0;
      // Play until terminal
      while (!gs.winner) {
        const cur: Player = gs.turn;
        const isP1 = cur === 'Light';
        const depth = isP1 ? settings.p1Depth : settings.p2Depth;
        const engine: EngineOptions | undefined = isP1 ? settings.p1Options : settings.p2Options;
        const engineWithWorkers: EngineOptions | undefined = engine ? { ...engine, workers: settings.workers } : { workers: settings.workers } as any;
        // Opening randomization disabled for ladder; exploration disabled
        try {
          const res = settings.useRootParallel
            ? await findBestMoveRootParallel(gs, { maxDepth: depth, timeLimitMs: Infinity, engine: engineWithWorkers })
            : await runner.startSearch({ state: gs, depth, timeMs: Infinity, engine: engineWithWorkers });
          const chosenMove = (res as any).bestMove ?? (res as any).moveId ?? null;
          if (chosenMove) { applyMoveRules(gs, chosenMove); moves++; } else { break; }
        } catch { break; }
        // Safety to avoid infinite loops
        if (moves > 512) break;
      }
      if (gs.winner === 'Light') winsLight++; else if (gs.winner === 'Dark') winsDark++; else draws++;
      // Yield a tick to not block the UI thread entirely
      await new Promise((r) => setTimeout(r, 0));
    }
    const wr = total > 0 ? (winsLight / total) : 0;
    return { games: total, winsLight, winsDark, draws, wr };
  }, [settings.p1Depth, settings.p2Depth, settings.p1Options, settings.p2Options, settings.useRootParallel, settings.workers]);

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
    // Attempt to load previous champion from localStorage
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('squadro.infoia.champion');
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj && obj.evalLight && obj.evalDark && typeof obj.metric === 'number' && obj.objective) {
            championRef.current = { wLight: obj.evalLight as EvalParams, wDark: obj.evalDark as EvalParams, metric: obj.metric as number, objective: obj.objective as any };
          }
        }
      }
    } catch {}
    let winsLight = 0;
    let winsDark = 0;
    let draws = 0;
    let lastWLight: EvalParams = (settings.p1Eval as EvalParams) as any;
    let lastWDark: EvalParams = (settings.p2Eval as EvalParams) as any;

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

        // Epsilon-greedy exploration (post-opening): with probability exploreEps, choose a random legal move
        const eps = Math.max(0, Math.min(1, Number(settings.exploreEps ?? 0)));
        if (eps > 0 && Math.random() < eps) {
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
            // Evaluation breakdown per move (after applying move), from mover's perspective
            try {
              const thr = (cur === 'Light' ? (settings.p1Eval?.sprint_threshold ?? 2) : (settings.p2Eval?.sprint_threshold ?? 2));
              const phi = computeFeatures(gs, cur, thr);
              const w = (cur === 'Light' ? settings.p1Eval : settings.p2Eval) as EvalParams | undefined;
              if (w) {
                const contrib = {
                  race: (w.w_race ?? 0) * phi.race,
                  done: (w.done_bonus ?? 0) * phi.done,
                  clash: (w.w_clash ?? 0) * phi.clash,
                  chain: (w.w_chain ?? 1) * phi.chain,
                  sprint: (w.w_sprint ?? 0) * phi.sprint,
                  block: (w.w_block ?? 0) * phi.block,
                  parity: (w.w_parity ?? 1) * phi.parity,
                  struct: (w.w_struct ?? 1) * phi.struct,
                  ones: (w.w_ones ?? 1) * phi.ones,
                  ret: (w.w_return ?? 1) * phi.ret,
                  waste: (w.w_waste ?? 1) * phi.waste,
                  mob: (w.w_mob ?? 1) * phi.mob,
                } as const;
                const total = Object.values(contrib).reduce((a, b) => a + b, 0);
                const evalInfo = {
                  phi,
                  w: {
                    w_race: w.w_race,
                    done_bonus: w.done_bonus,
                    w_clash: w.w_clash,
                    w_chain: w.w_chain,
                    w_sprint: w.w_sprint,
                    w_block: w.w_block,
                    w_parity: w.w_parity,
                    w_struct: w.w_struct,
                    w_ones: w.w_ones,
                    w_return: w.w_return,
                    w_waste: w.w_waste,
                    w_mob: w.w_mob,
                  },
                  contrib,
                  total,
                } as any;
                explain = { ...(explain as any), eval: evalInfo } as any;
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
      const p1Score = gs.pieces.filter((p) => p.owner === 'Light' && p.state === 'retirada').length;
      const p2Score = gs.pieces.filter((p) => p.owner === 'Dark' && p.state === 'retirada').length;
      let tuneSummary: InfoIARecord['tune'] | undefined = undefined;
      if (gs.winner === 'Light') winsLight++;
      else if (gs.winner === 'Dark') winsDark++;
      else draws++;

      // === AutoTune: actualizar w_* tras cada partida ===
      try {
        if (settings.autoTuneEnabled) {
          // Reconstruir la secuencia de estados para calcular φ_t por turno
          let replay: GameState = createInitialState();
          // Alinear el turno inicial del replay con el primer movimiento registrado
          if (curDetails.length > 0 && curDetails[0]?.player) {
            replay.turn = curDetails[0].player as Player;
          }
          // Determinar objetivo (K) en puntos por resultado, orientado al jugador a mover.
          // Si no se especifica en settings, calibrar como mediana(|pred|) pre-update.
          const median = (arr: number[]): number => {
            if (arr.length === 0) return 0;
            const s = [...arr].sort((a, b) => a - b);
            const m = Math.floor(s.length / 2);
            return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
          };
          const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
          const wLight0: EvalParams = { ...(settings.p1Eval as EvalParams) };
          const wDark0: EvalParams = { ...(settings.p2Eval as EvalParams) };
          let replayForK: GameState = createInitialState();
          if (curDetails.length > 0 && curDetails[0]?.player) {
            replayForK.turn = curDetails[0].player as Player;
          }
          const predsAbs: number[] = [];
          for (let idxK = 0; idxK < curDetails.length; idxK++) {
            const curK: Player = replayForK.turn;
            const thrK = (curK === 'Light' ? (settings.p1Eval?.sprint_threshold ?? 2) : (settings.p2Eval?.sprint_threshold ?? 2));
            const phiK = computeFeatures(replayForK, curK, thrK);
            const yhatK = curK === 'Light' ? predictScore(wLight0, phiK) : predictScore(wDark0, phiK);
            predsAbs.push(Math.abs(yhatK));
            try { applyMoveRules(replayForK, curDetails[idxK].bestMove as any); } catch {}
          }
          const K = Math.max(1, Math.round(settings.autoTuneK ?? clamp(median(predsAbs) || 400, 100, 600)));
          // pesos locales (copias) para SGD
          let wLight: EvalParams = { ...(settings.p1Eval as EvalParams) };
          let wDark: EvalParams = { ...(settings.p2Eval as EvalParams) };
          const wLightInit: EvalParams = { ...wLight };
          const wDarkInit: EvalParams = { ...wDark };
          const lrBase = Math.max(1e-6, Number(settings.autoTuneLr ?? 0.001));
          const lrCurr = (() => {
            if (lrRef.current == null) { lrRef.current = lrBase; }
            return lrRef.current;
          })();
          const reg = Math.max(0, Number(settings.autoTuneReg ?? 0.00001));
          const warmup = Math.max(0, Math.round(settings.autoTuneWarmupPlies ?? 0));
          const holdFrac = (() => {
            const f = Number.isFinite(settings.autoTuneHoldoutFrac as any) ? Number(settings.autoTuneHoldoutFrac) : 0.2;
            return clamp(f, 0, 0.9);
          })();
          // Paso simple: usar un patrón periódico para holdout (1 de cada M)
          const holdModulo = holdFrac > 0 ? Math.max(5, Math.round(1 / Math.max(0.01, holdFrac))) : 1e9;
          let stepsUsed = 0;
          let sse = 0;
          let holdY: number[] = [];
          let holdAbsErr = 0;
          let holdSSRes = 0;
          let holdSSE = 0;
          let holdLogLossSum = 0;
          let holdBrierSum = 0;
          // Objective is fixed for this game
          const objective = (settings.autoTuneObjective ?? 'mse') as 'mse' | 'huber' | 'logistic';
          // Entrenamiento con holdout periódico y métricas pre-update
          for (let idx = 0; idx < curDetails.length; idx++) {
            const step = curDetails[idx];
            const cur: Player = replay.turn;
            // Objetivo y
            // - mse/huber: y = ±K (ganar/perder desde el lado que mueve), 0 en tablas
            // - logistic: y = 1 si gana el lado que mueve, 0 si pierde, 0.5 si tablas
            let y = 0;
            if (objective === 'logistic') {
              if (gs.winner === 'Light') y = (cur === 'Light') ? 1 : 0;
              else if (gs.winner === 'Dark') y = (cur === 'Dark') ? 1 : 0;
              else y = 0.5;
            } else {
              if (gs.winner === 'Light') y = (cur === 'Light') ? +K : -K;
              else if (gs.winner === 'Dark') y = (cur === 'Dark') ? +K : -K;
              else y = 0;
            }
            // φ en escala base, usando sprint_threshold del jugador actual
            const thr = (cur === 'Light' ? (settings.p1Eval?.sprint_threshold ?? 2) : (settings.p2Eval?.sprint_threshold ?? 2));
            const phi = computeFeatures(replay, cur, thr);
            // Warmup: saltar las primeras N actualizaciones
            const allowLight = settings.autoTuneTuneLight !== false;
            const allowDark = settings.autoTuneTuneDark !== false;
            const canTuneSide = ((cur === 'Light' && allowLight) || (cur === 'Dark' && allowDark));
            const isHoldout = (idx % holdModulo === 0);
            // Pre-update prediction for metrics
            const yhatPre = cur === 'Light' ? predictScore(wLight, phi) : predictScore(wDark, phi);
            if (isHoldout) {
              holdY.push(y);
              holdAbsErr += Math.abs(y - yhatPre);
              holdSSE += (y - yhatPre) * (y - yhatPre);
              if (objective === 'logistic') {
                const Klog = settings.autoTuneLogisticK ?? K;
                const pHat = 1 / (1 + Math.exp(-(yhatPre / Math.max(1, Klog))))
                const yProb = y; // already 0/0.5/1 for logistic objective
                // Numerical stability for log
                const eps = 1e-9;
                const pClamped = Math.min(1 - eps, Math.max(eps, pHat));
                holdLogLossSum += -(yProb * Math.log(pClamped) + (1 - yProb) * Math.log(1 - pClamped));
                holdBrierSum += (pHat - yProb) * (pHat - yProb);
              }
              // SSRes for R^2 computed after loop (need mean of y)
            }
            if (idx >= warmup && canTuneSide && !isHoldout) {
              const e = y - yhatPre;
              sse += e * e;
              stepsUsed++;
              const tuneParams = {
                lr: lrCurr,
                reg,
                clip: DEFAULT_CLIP,
                objective,
                huberDelta: settings.autoTuneHuberDelta,
                logisticK: settings.autoTuneLogisticK ?? K,
                gradClip: settings.autoTuneGradClip,
              } as const;
              if (cur === 'Light') {
                wLight = updateWeights(wLight, phi, y, tuneParams as any);
              } else {
                wDark = updateWeights(wDark, phi, y, tuneParams as any);
              }
            }
            // Avanzar el estado con la jugada aplicada en ese paso
            try { applyMoveRules(replay, step.bestMove as any); } catch {}
          }

          // Propagar los nuevos pesos hacia fuera (estado de InfoIA)
          if (settings.onTuneP1Eval) settings.onTuneP1Eval(wLight);
          if (settings.onTuneP2Eval) settings.onTuneP2Eval(wDark);
          lastWLight = wLight;
          lastWDark = wDark;
          // EMA update (optional)
          try {
            if (settings.autoTuneUseEMA) {
              const beta = Math.min(1, Math.max(0, settings.autoTuneEMABeta ?? 0.1));
              const blend = (prev: EvalParams | null, cur: EvalParams): EvalParams => {
                if (!prev) return { ...cur } as EvalParams;
                const out: any = { ...prev };
                const keys: (keyof EvalParams)[] = ['w_race','w_clash','w_sprint','w_block','done_bonus','w_chain','w_parity','w_struct','w_ones','w_return','w_waste','w_mob','sprint_threshold'];
                for (const k of keys) {
                  const a = (prev as any)[k] ?? 1;
                  const b = (cur as any)[k] ?? 1;
                  (out as any)[k] = (1 - beta) * a + beta * b;
                }
                return out as EvalParams;
              };
              emaLightRef.current = blend(emaLightRef.current, wLight);
              emaDarkRef.current = blend(emaDarkRef.current, wDark);
            }
          } catch {}
          // Persistir inmediatamente en localStorage para evitar pérdidas en recargas rápidas
          try {
            if (typeof window !== 'undefined') {
              // P1
              try {
                const k1 = 'squadro.infoia.p1';
                const o1 = (() => { try { return JSON.parse(localStorage.getItem(k1) || '{}') || {}; } catch { return {}; } })();
                localStorage.setItem(k1, JSON.stringify({ ...o1, eval: wLight }));
              } catch {}
              // P2
              try {
                const k2 = 'squadro.infoia.p2';
                const o2 = (() => { try { return JSON.parse(localStorage.getItem(k2) || '{}') || {}; } catch { return {}; } })();
                localStorage.setItem(k2, JSON.stringify({ ...o2, eval: wDark }));
              } catch {}
            }
          } catch {}
          const mae = stepsUsed > 0 ? Math.sqrt(sse / stepsUsed) : 0;
          // Holdout metrics: MAE and R^2 using pre-update predictions
          const holdMean = holdY.length > 0 ? (holdY.reduce((a, b) => a + b, 0) / holdY.length) : 0;
          if (holdY.length > 0) {
            for (const yy of holdY) {
              const d = yy - holdMean;
              holdSSRes += d * d;
            }
          }
          const holdMAE = holdY.length > 0 ? (holdAbsErr / holdY.length) : undefined;
          const holdR2 = (holdY.length > 1 && holdSSRes > 0) ? (1 - (holdSSE / holdSSRes)) : undefined;
          const holdLogLoss = (objective === 'logistic' && holdY.length > 0) ? (holdLogLossSum / holdY.length) : undefined;
          const holdBrier = (objective === 'logistic' && holdY.length > 0) ? (holdBrierSum / holdY.length) : undefined;
          // End holdout computation
          const diff = (a: EvalParams, b: EvalParams) => {
            const keys: (keyof EvalParams)[] = ['w_race','w_clash','w_sprint','w_block','done_bonus','w_chain','w_parity','w_struct','w_ones','w_return','w_waste','w_mob'];
            let sum = 0;
            for (const k of keys) {
              const va = (a as any)[k] ?? 1;
              const vb = (b as any)[k] ?? 1;
              sum += Math.abs(va - vb);
            }
            return sum;
          };
          tuneSummary = {
            steps: stepsUsed,
            mae,
            dWLight: diff(wLight, wLightInit),
            dWDark: diff(wDark, wDarkInit),
            tunedLight: settings.autoTuneTuneLight !== false,
            tunedDark: settings.autoTuneTuneDark !== false,
            lr: lrCurr,
            reg: reg,
            K,
            warmup,
            holdoutFrac: holdFrac,
            holdoutMAE: holdMAE,
            holdoutR2: holdR2,
            objective,
            huberDelta: settings.autoTuneHuberDelta,
            logisticK: settings.autoTuneLogisticK ?? K,
            gradClip: settings.autoTuneGradClip,
            holdoutLogLoss: holdLogLoss,
            holdoutBrier: holdBrier,
          };
          // Champion by objective metric and early stopping/rollback
          try {
            const patienceMax = Math.max(1, Math.round(settings.autoTunePatience ?? 200));
            const lrDecay = Math.max(0.01, Math.min(1, settings.autoTuneLrDecay ?? 0.5));
            const metric = (() => {
              if (objective === 'logistic' && typeof holdLogLoss === 'number') return holdLogLoss;
              if (typeof holdMAE === 'number') return holdMAE;
              return undefined;
            })();
            const pickWeights = (): { L: EvalParams; D: EvalParams } => {
              if (settings.autoTuneUseEMA && emaLightRef.current && emaDarkRef.current) {
                return { L: emaLightRef.current, D: emaDarkRef.current };
              }
              return { L: wLight, D: wDark };
            };
            if (typeof metric === 'number' && Number.isFinite(metric)) {
              if (!championRef.current || metric < championRef.current.metric - 1e-9 || championRef.current.objective !== objective) {
                const sel = pickWeights();
                championRef.current = { wLight: { ...sel.L }, wDark: { ...sel.D }, metric, objective };
                patienceRef.current = 0;
                // Persist champion
                try {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('squadro.infoia.champion', JSON.stringify({ evalLight: championRef.current.wLight, evalDark: championRef.current.wDark, metric, objective, ts: Date.now() }));
                  }
                } catch {}
              } else {
                patienceRef.current++;
                if (patienceRef.current >= patienceMax && championRef.current) {
                  // Rollback to champion and decay LR
                  const c = championRef.current;
                  try {
                    if (settings.onTuneP1Eval) settings.onTuneP1Eval(c.wLight);
                    if (settings.onTuneP2Eval) settings.onTuneP2Eval(c.wDark);
                  } catch {}
                  lastWLight = c.wLight; lastWDark = c.wDark;
                  // Persist current weights as active
                  try {
                    if (typeof window !== 'undefined') {
                      const k1 = 'squadro.infoia.p1';
                      const o1 = (() => { try { return JSON.parse(localStorage.getItem(k1) || '{}') || {}; } catch { return {}; } })();
                      localStorage.setItem(k1, JSON.stringify({ ...o1, eval: c.wLight }));
                      const k2 = 'squadro.infoia.p2';
                      const o2 = (() => { try { return JSON.parse(localStorage.getItem(k2) || '{}') || {}; } catch { return {}; } })();
                      localStorage.setItem(k2, JSON.stringify({ ...o2, eval: c.wDark }));
                    }
                  } catch {}
                  // Decay LR for subsequent updates
                  lrRef.current = Math.max(1e-6, (lrRef.current ?? lrBase) * lrDecay);
                  patienceRef.current = 0;
                }
              }
            }
          } catch {}
          if (settings.autoTuneLog && tuneSummary) {
            // eslint-disable-next-line no-console
            console.log('[AutoTune] steps=%d mae=%.3f dW(Light)=%.3f dW(Dark)=%.3f', stepsUsed, mae, tuneSummary.dWLight, tuneSummary.dWDark);
          }
          // Auto-save preset every N games if enabled
          try {
            const doAuto = !!settings.autoTuneAutoSave;
            const every = Math.max(1, Math.round(settings.autoTuneSaveEvery ?? 10));
            if (doAuto && ((g + 1) % every === 0)) {
              settings.onAutoSaveTunedPreset?.();
            }
          } catch {}
        }
      } catch {}

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
        tune: tuneSummary,
        details: curDetails,
      });

      // Yield between games
      await new Promise((r) => setTimeout(r, 0));
    }

    runningRef.current = false;
    setRunning(false);
    try {
      if (typeof window !== 'undefined') {
        const total = Math.max(1, winsLight + winsDark + draws);
        const wrl = winsLight / total;
        const wrd = winsDark / total;
        try {
          const k1 = 'squadro.infoia.best.light';
          const cur1 = (() => { try { return JSON.parse(localStorage.getItem(k1) || '{}') || {}; } catch { return {}; } })();
          if (!cur1.wr || wrl > cur1.wr) {
            localStorage.setItem(k1, JSON.stringify({ eval: lastWLight, wr: wrl, games: total, ts: Date.now(), lr: settings.autoTuneLr, reg: settings.autoTuneReg, K: settings.autoTuneK, warmup: settings.autoTuneWarmupPlies }));
          }
        } catch {}
        try {
          const k2 = 'squadro.infoia.best.dark';
          const cur2 = (() => { try { return JSON.parse(localStorage.getItem(k2) || '{}') || {}; } catch { return {}; } })();
          if (!cur2.wr || wrd > cur2.wr) {
            localStorage.setItem(k2, JSON.stringify({ eval: lastWDark, wr: wrd, games: total, ts: Date.now(), lr: settings.autoTuneLr, reg: settings.autoTuneReg, K: settings.autoTuneK, warmup: settings.autoTuneWarmupPlies }));
          }
        } catch {}
      }
    } catch {}
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

  return { running, start, stop, runningRef, miniLadder, moveIndex, moveElapsedMs, moveTargetMs, progDepth, progNodes, progScore, progNps };
}
