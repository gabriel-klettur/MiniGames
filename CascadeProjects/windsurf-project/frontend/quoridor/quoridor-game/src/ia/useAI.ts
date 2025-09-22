import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import type { RootState } from '../store/index.ts';
import { setBusy, setStats, resetStats } from '../store/iaSlice.ts';
import { movePawn, placeWall } from '../store/gameSlice.ts';
import { searchBestMove } from './minimax.ts';
import type { AIMove } from './types.ts';
import { goalRow } from '../game/rules.ts';

export function useAI() {
  const dispatch = useAppDispatch();
  const ia = useAppSelector((s: RootState) => s.ia);
  const game = useAppSelector((s: RootState) => s.game);

  const hasWinner =
    game.pawns.L.row === goalRow(game.size, 'L') ||
    game.pawns.D.row === goalRow(game.size, 'D');

  const requestAIMove = useCallback(async (force = false) => {
    if (ia.stats.busy) return;
    if (hasWinner) return;
    // Autoplay respeta control; petición manual puede forzar
    if (!force && !ia.control[game.current]) return;

    dispatch(setBusy(true));
    dispatch(resetStats());

    const start = performance.now();
    const deadline = ia.timeMode === 'manual' ? performance.now() + Math.max(0, ia.timeSeconds) * 1000 : undefined;

    // Ejecutar búsqueda (sin worker por simplicidad). Para no bloquear brevemente, encapsulamos en Promise.
    const result = await new Promise<ReturnType<typeof searchBestMove>>((resolve) => {
      // Microtask para permitir pintar "Pensando…"
      setTimeout(() => {
        resolve(searchBestMove(
          game,
          { maxDepth: ia.depth, deadlineMs: deadline, config: ia.config },
          game.current
        ));
      }, 0);
    });

    const elapsedMs = performance.now() - start;

    dispatch(setStats({
      nodes: result.nodes,
      elapsedMs,
      depthReached: result.depthReached,
      evalScore: result.score,
      pv: result.pv as AIMove[],
      rootMoves: result.rootMoves,
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

  return {
    requestAIMove,
    busy: ia.stats.busy,
    autoplay: ia.autoplay,
    stats: ia.stats,
    ia,
  };
}
