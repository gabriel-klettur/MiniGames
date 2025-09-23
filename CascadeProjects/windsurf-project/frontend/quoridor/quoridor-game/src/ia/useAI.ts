import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import type { RootState } from '../store/index.ts';
import { setBusy, setStats } from '../store/iaSlice.ts';
import { movePawn, placeWall } from '../store/gameSlice.ts';
import { searchBestMove } from './minimax.ts';
import type { AIMove, TraceEvent } from './types.ts';
import { goalRow } from '../game/rules.ts';
import { shortestDistanceToGoal } from './eval.ts';
import { traceBuffer } from './trace.ts';

export function useAI() {
  const dispatch = useAppDispatch();
  const ia = useAppSelector((s: RootState) => s.ia);
  const game = useAppSelector((s: RootState) => s.game);
  const workerRef = useRef<Worker | null>(null);
  const startRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const jobIdRef = useRef<string | null>(null);
  const turnSeqRef = useRef<number>(0);
  // Throttled trace processing
  const traceQueueRef = useRef<TraceEvent[][]>([]);
  const traceRafRef = useRef<number | null>(null);
  const traceCountRef = useRef<number>(0);
  const scheduleTraceDrain = useCallback(() => {
    if (traceRafRef.current != null) return; // already scheduled
    const drain = () => {
      traceRafRef.current = null;
      const tStart = performance.now();
      const budgetMs = 8; // process up to ~8ms per frame
      while (traceQueueRef.current.length > 0 && (performance.now() - tStart) < budgetMs) {
        const batch = traceQueueRef.current.shift();
        if (batch && batch.length) traceBuffer.add(batch);
      }
      if (traceQueueRef.current.length > 0) {
        traceRafRef.current = requestAnimationFrame(drain);
      }
    };
    traceRafRef.current = requestAnimationFrame(drain);
  }, []);
  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        // Attempt cooperative cancel first
        if (jobIdRef.current) {
          try { workerRef.current.postMessage({ id: jobIdRef.current, type: 'cancel' }); } catch {}
          jobIdRef.current = null;
        }
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (tickRef.current !== null) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, []);

  const hasWinner =
    game.pawns.L.row === goalRow(game.size, 'L') ||
    game.pawns.D.row === goalRow(game.size, 'D');

  const cancelThinking = useCallback(() => {
    if (workerRef.current && jobIdRef.current) {
      try {
        console.info('[IA] cancel solicitado', { id: jobIdRef.current });
        workerRef.current.postMessage({ id: jobIdRef.current, type: 'cancel' });
      } catch {}
    }
  }, []);

  const requestAIMove = useCallback(async (force = false) => {
    if (ia.stats.busy) return;
    if (hasWinner) return;
    // Autoplay respeta control; petición manual puede forzar
    if (!force && !ia.control[game.current]) return;

    // Increment turn counter and announce turn
    const seq = ++turnSeqRef.current;
    console.info(`[IA][#${seq}] Turno ${game.current}`);

    // Configurar buffer de trazas antes de iniciar
    traceBuffer.setMax(ia.trace.cap);
    if (ia.trace.enabled) traceBuffer.clear();

    startRef.current = performance.now();
    dispatch(setBusy(true));
    // Reset KPIs but preserve busy=true
    dispatch(setStats({ nodes: 0, elapsedMs: 0, depthReached: 0, evalScore: null, pv: [], rootMoves: [] } as any));

    const start = performance.now();
    // Compute deadline/budget with configurable safety margin (seconds)
    const safetyMs = Math.max(0, (ia.config.safetyMarginSeconds ?? 0) * 1000);

    // Heuristic Auto-mode: allocate time based on game complexity
    const computeAutoBudgetMs = (): number => {
      const rp = game.current;
      const op = rp === 'L' ? 'D' : 'L';
      const wallsTotal = (game.wallsLeft['L'] ?? 0) + (game.wallsLeft['D'] ?? 0);
      const dMe = shortestDistanceToGoal(game, rp);
      const dOp = shortestDistanceToGoal(game, op);
      let sec = 1.2; // base
      // Opening/midgame: many wall options -> more time
      if (wallsTotal >= 14) sec += 0.8; else if (wallsTotal >= 8) sec += 0.4;
      // Critical race: near goal -> add time
      if (dMe <= 2 || dOp <= 2) sec += 0.6; else if (dMe <= 3 || dOp <= 3) sec += 0.3;
      // Light scaling with difficulty depth
      if (ia.depth >= 7) sec += 0.4; else if (ia.depth >= 5) sec += 0.2;
      // Clamp bounds
      sec = Math.max(0.5, Math.min(5.0, sec));
      return Math.round(sec * 1000);
    };

    const manualBudgetMs = ia.timeMode === 'manual' ? Math.max(0, ia.timeSeconds * 1000 - safetyMs) : undefined;
    const autoBudgetMsRaw = ia.timeMode === 'auto' ? computeAutoBudgetMs() : undefined;
    const effectiveBudgetMs = (manualBudgetMs ?? (autoBudgetMsRaw != null ? Math.max(0, autoBudgetMsRaw - safetyMs) : undefined));
    const deadline = effectiveBudgetMs != null ? (performance.now() + effectiveBudgetMs) : undefined;

    let result: ReturnType<typeof searchBestMove>;
    // Telemetry context
    const tele = {
      mode: ia.timeMode,
      depth: ia.depth,
      safetyMs,
      autoBudgetMsRaw: ia.timeMode === 'auto' ? (undefined as number | undefined) : undefined,
      effectiveBudgetMs: effectiveBudgetMs as number | undefined,
      deadline,
      traceCfg: { enabled: ia.trace.enabled, sampleRate: ia.trace.sampleRate, maxDepth: ia.trace.maxDepth, cap: ia.trace.cap },
      cfg: {
        iterative: ia.config.enableIterative,
        alphaBeta: ia.config.enableAlphaBeta,
        pvs: ia.config.enablePVS,
        lmr: ia.config.enableLMR,
        tt: ia.config.enableTT,
        ttSize: ia.config.ttSize,
      },
    };
    if (ia.timeMode === 'auto') {
      const rp = game.current; const op = rp === 'L' ? 'D' : 'L';
      const wallsTotal = (game.wallsLeft['L'] ?? 0) + (game.wallsLeft['D'] ?? 0);
      const dMe = shortestDistanceToGoal(game, rp);
      const dOp = shortestDistanceToGoal(game, op);
      // recompute to log
      const computeAutoBudgetMs = (): number => {
        let sec = 1.2;
        if (wallsTotal >= 14) sec += 0.8; else if (wallsTotal >= 8) sec += 0.4;
        if (dMe <= 2 || dOp <= 2) sec += 0.6; else if (dMe <= 3 || dOp <= 3) sec += 0.3;
        if (ia.depth >= 7) sec += 0.4; else if (ia.depth >= 5) sec += 0.2;
        sec = Math.max(0.5, Math.min(5.0, sec));
        return Math.round(sec * 1000);
      };
      const raw = computeAutoBudgetMs();
      const eff = Math.max(0, raw - safetyMs);
      tele.autoBudgetMsRaw = raw;
      tele.effectiveBudgetMs = eff;
    }
    // Reset trace counters
    traceCountRef.current = 0;
    console.log(`[IA][#${seq}] Inicio pensamiento`);
    console.log(`[IA][#${seq}] Estado inicial`, { current: game.current, pawns: game.pawns, wallsLeft: game.wallsLeft, size: game.size });
    console.log(`[IA][#${seq}] Parámetros`, tele);
    // Always try Web Worker first to keep UI responsive for live time updates
    try {
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' });
      }
      const w = workerRef.current;
      const id = Math.random().toString(36).slice(2);
      jobIdRef.current = id;
      result = await new Promise((resolve, reject) => {
        const onMessage = (ev: MessageEvent<any>) => {
          const msg = ev.data;
          if (!msg || (msg.id !== id)) return; // ignore other messages
          if (msg.type === 'trace') {
            const evs: TraceEvent[] = msg.payload?.events ?? [];
            if (ia.trace.enabled && evs.length) {
              traceQueueRef.current.push(evs);
              traceCountRef.current += evs.length;
              scheduleTraceDrain();
            }
            return; // keep listening
          }
          // For terminal messages, cleanup listeners and resolve
          w.removeEventListener('message', onMessage as any);
          w.removeEventListener('error', onError as any);
          jobIdRef.current = null;
          if (msg.type === 'result') {
            resolve(msg.payload);
          } else if (msg.type === 'error') {
            reject(new Error(msg.payload?.message ?? 'Worker error'));
          } else {
            reject(new Error('Worker message desconocido'));
          }
        };
        const onError = (e: ErrorEvent) => {
          w.removeEventListener('message', onMessage as any);
          w.removeEventListener('error', onError as any);
          jobIdRef.current = null;
          reject(e.error ?? new Error(String(e.message)));
        };
        w.addEventListener('message', onMessage as any);
        w.addEventListener('error', onError as any);
        w.postMessage({
          id,
          type: 'search',
          payload: {
            state: game,
            // IMPORTANT: pass relative budgetMs so worker can compute its own deadline
            params: { maxDepth: ia.depth, /* no absolute deadlineMs to avoid cross-context time origin issues */ config: ia.config },
            rootPlayer: game.current,
            budgetMs: effectiveBudgetMs,
            traceConfig: ia.trace.enabled ? { enabled: true, sampleRate: ia.trace.sampleRate, maxDepth: ia.trace.maxDepth } : { enabled: false, sampleRate: 0 },
          },
        });
        console.log(`[IA][#${seq}] Worker enviado`, { id, deadline, budgetMs: effectiveBudgetMs });
      });
    } catch (err) {
      // Fallback sin worker (sentimos: la UI no podrá animar mientras el cómputo bloquee el hilo)
      result = await new Promise<ReturnType<typeof searchBestMove>>((resolve) => {
        setTimeout(() => {
          const id = `fallback-${Math.random().toString(36).slice(2)}`;
          console.warn(`[IA][#${seq}] Worker no disponible; usando fallback en hilo principal`, { id, deadline });
          resolve(searchBestMove(
            game,
            {
              maxDepth: ia.depth,
              deadlineMs: deadline, // in auto mode we already computed deadline from effectiveBudgetMs
              config: ia.config,
              traceConfig: ia.trace.enabled ? { enabled: true, sampleRate: ia.trace.sampleRate, maxDepth: ia.trace.maxDepth } : { enabled: false, sampleRate: 0 },
              onTrace: (ev) => { if (ia.trace.enabled) traceBuffer.add(ev as any); },
              shouldStop: () => false, // no cooperative cancel in fallback single-thread
            },
            game.current,
          ));
        }, 0);
      });
    }

    const elapsedMs = performance.now() - start;

    // Calcular distancias mínimas para el jugador raíz y su oponente en el estado actual
    const rp = game.current;
    const op = rp === 'L' ? 'D' : 'L';
    const dMe = shortestDistanceToGoal(game, rp);
    const dOp = shortestDistanceToGoal(game, op);

    dispatch(setStats({
      nodes: result.nodes,
      elapsedMs,
      depthReached: result.depthReached,
      evalScore: result.score,
      pv: result.pv as AIMove[],
      rootMoves: result.rootMoves,
      dMe,
      dOp,
    }));

    // Telemetry result & overshoot
    const requestedMs = ia.timeMode === 'manual'
      ? Math.max(0, ia.timeSeconds * 1000 - safetyMs)
      : (tele.effectiveBudgetMs ?? 0);
    const overshootMs = requestedMs ? (elapsedMs - requestedMs) : 0;
    console.log(`[IA][#${seq}] Resultado`, {
      elapsedMs,
      requestedMs,
      overshootMs,
      nodes: result.nodes,
      depthReached: result.depthReached,
      score: result.score,
      pv: result.pv,
      rootMoves: result.rootMoves?.slice?.(0, 8),
      traceEventsReceived: traceCountRef.current,
      distances: { dMe, dOp },
    });
    if (overshootMs > 0) {
      console.warn(`[IA][#${seq}] Overshoot de tiempo`, { overshootMs });
    }

    if (result.best) {
      const m = result.best;
      if (m.kind === 'pawn') {
        dispatch(movePawn({ row: m.to.row, col: m.to.col }));
      } else {
        dispatch(placeWall({ o: m.wall.o, r: m.wall.r, c: m.wall.c }));
      }
    }

    dispatch(setBusy(false));
  }, [dispatch, game, ia, hasWinner]);

  // Autoplay: si está activo y es turno de un bando IA, pensar automáticamente.
  useEffect(() => {
    if (ia.autoplay && !ia.stats.busy && !hasWinner && ia.control[game.current]) {
      // lanza pensamiento asíncrono
      requestAIMove(false);
    }
  }, [ia.autoplay, ia.stats.busy, ia.control, game.current, hasWinner, requestAIMove]);

  // Live timer: mientras busy=true, actualizar elapsedMs en stats cada 100ms.
  useEffect(() => {
    if (ia.stats.busy) {
      if (startRef.current == null) startRef.current = performance.now();
      if (tickRef.current == null) {
        tickRef.current = window.setInterval(() => {
          if (startRef.current != null) {
            const elapsed = performance.now() - startRef.current;
            dispatch(setStats({ elapsedMs: elapsed }));
          }
        }, 100);
      }
    } else {
      if (tickRef.current != null) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      startRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ia.stats.busy]);

  return {
    requestAIMove,
    cancelThinking,
    busy: ia.stats.busy,
    autoplay: ia.autoplay,
    stats: ia.stats,
    ia,
  };
}
