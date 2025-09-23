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
  // Throttled trace processing
  const traceQueueRef = useRef<TraceEvent[][]>([]);
  const traceRafRef = useRef<number | null>(null);
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

  const requestAIMove = useCallback(async (force = false) => {
    if (ia.stats.busy) return;
    if (hasWinner) return;
    // Autoplay respeta control; petición manual puede forzar
    if (!force && !ia.control[game.current]) return;

    // Configurar buffer de trazas antes de iniciar
    traceBuffer.setMax(ia.trace.cap);
    if (ia.trace.enabled) traceBuffer.clear();

    startRef.current = performance.now();
    dispatch(setBusy(true));
    // Reset KPIs but preserve busy=true
    dispatch(setStats({ nodes: 0, elapsedMs: 0, depthReached: 0, evalScore: null, pv: [], rootMoves: [] } as any));

    const start = performance.now();
    const deadline = ia.timeMode === 'manual' ? performance.now() + Math.max(0, ia.timeSeconds) * 1000 : undefined;

    let result: ReturnType<typeof searchBestMove>;
    // Always try Web Worker first to keep UI responsive for live time updates
    try {
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' });
      }
      const w = workerRef.current;
      const id = Math.random().toString(36).slice(2);
      result = await new Promise((resolve, reject) => {
        const onMessage = (ev: MessageEvent<any>) => {
          const msg = ev.data;
          if (!msg || (msg.id !== id)) return; // ignore other messages
          if (msg.type === 'trace') {
            const evs: TraceEvent[] = msg.payload?.events ?? [];
            if (ia.trace.enabled && evs.length) {
              traceQueueRef.current.push(evs);
              scheduleTraceDrain();
            }
            return; // keep listening
          }
          // For terminal messages, cleanup listeners and resolve
          w.removeEventListener('message', onMessage as any);
          w.removeEventListener('error', onError as any);
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
          reject(e.error ?? new Error(String(e.message)));
        };
        w.addEventListener('message', onMessage as any);
        w.addEventListener('error', onError as any);
        w.postMessage({
          id,
          type: 'search',
          payload: {
            state: game,
            params: { maxDepth: ia.depth, deadlineMs: deadline, config: ia.config },
            rootPlayer: game.current,
            traceConfig: ia.trace.enabled ? { enabled: true, sampleRate: ia.trace.sampleRate, maxDepth: ia.trace.maxDepth } : { enabled: false, sampleRate: 0 },
          },
        });
      });
    } catch (err) {
      // Fallback sin worker (sentimos: la UI no podrá animar mientras el cómputo bloquee el hilo)
      result = await new Promise<ReturnType<typeof searchBestMove>>((resolve) => {
        setTimeout(() => {
          resolve(searchBestMove(
            game,
            {
              maxDepth: ia.depth,
              deadlineMs: deadline,
              config: ia.config,
              traceConfig: ia.trace.enabled ? { enabled: true, sampleRate: ia.trace.sampleRate, maxDepth: ia.trace.maxDepth } : { enabled: false, sampleRate: 0 },
              onTrace: (ev) => { if (ia.trace.enabled) traceBuffer.add(ev as any); },
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
    busy: ia.stats.busy,
    autoplay: ia.autoplay,
    stats: ia.stats,
    ia,
  };
}
