import { useCallback } from 'react';
import type { GameState } from '../../game/types';
import type { MoveEntry } from '../usePersistence';
import { isGameOver } from '../../game/rules';

export interface UseExportHistoryParams {
  state: GameState;
  moves: MoveEntry[];
  finishedGames: any[];
  setMoves: React.Dispatch<React.SetStateAction<MoveEntry[]>>;
  setFinishedGames: React.Dispatch<React.SetStateAction<any[]>>;
  vsAI: null | { enemy: 'L' | 'D'; depth: number };
  iaDepth: number;
  iaTimeMode: 'auto' | 'manual';
  iaTimeSeconds: number;
}

export function useExportHistory(params: UseExportHistoryParams) {
  const { state, moves, finishedGames, setMoves, setFinishedGames, vsAI, iaDepth, iaTimeMode, iaTimeSeconds } = params;

  const downloadCurrentGame = useCallback(() => {
    const over = isGameOver(state);
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const current = (moves.length > 0 || over.over)
      ? {
          id: `current-${ts}`,
          endedAt: new Date().toISOString(),
          winner: over.over ? (over.winner ?? null) : null,
          reason: over.reason ?? undefined,
          vsAI,
          iaDepth,
          iaTimeMode,
          iaTimeSeconds,
          totalMoves: moves.length,
          moves,
        }
      : null;
    const payload = {
      exportedAt: new Date().toISOString(),
      archived: finishedGames,
      current,
    } as const;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pylos_historial_${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state, moves, finishedGames, vsAI, iaDepth, iaTimeMode, iaTimeSeconds]);

  const clearHistory = useCallback(() => {
    const ok = window.confirm('¿Seguro que quieres limpiar el historial actual y todas las partidas archivadas? Esta acción no se puede deshacer.');
    if (!ok) return;
    setMoves([]);
    setFinishedGames([]);
  }, [setMoves, setFinishedGames]);

  return { downloadCurrentGame, clearHistory } as const;
}
