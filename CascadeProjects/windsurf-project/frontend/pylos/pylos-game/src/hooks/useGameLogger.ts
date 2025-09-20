import { useCallback, useEffect, useRef } from 'react';
import type { GameState } from '../game/types';

/**
 * useGameLogger — centraliza el logging de snapshots del juego.
 * - Loggea el estado inicial una sola vez al montar.
 * - Expone una función `logSnapshot` para registrar cambios relevantes.
 */
export function useGameLogger(state: GameState) {
  const didInit = useRef(false);

  const cellSymbol = useCallback((cell: 'L' | 'D' | null): string => (
    cell === 'L' ? '○' : cell === 'D' ? '●' : '·'
  ), []);

  const logSnapshot = useCallback((snapshot: GameState, label?: string) => {
    const { board, currentPlayer, phase, reserves } = snapshot;
    const header = label ?? `Turno de ${currentPlayer} — Fase: ${phase}`;
    try {
      console.groupCollapsed(header);
      console.info(`Jugador: ${currentPlayer} | Fase: ${phase} | Reservas: L=${reserves.L} D=${reserves.D}`);
      for (let l = 0; l < board.length; l++) {
        const grid = board[l];
        const size = grid.length;
        console.log(`Nivel ${l} (${size}x${size})`);
        const table = grid.map((row, r) => row.map((cell, c) => {
          let sym = cellSymbol(cell);
          const sel = snapshot.selectedSource;
          if (phase === 'selectMoveDest' && sel && sel.level === l && sel.row === r && sel.col === c) {
            sym = `${sym}S`;
          }
          return sym;
        }));
        console.table(table);
      }
      console.groupEnd();
    } catch {
      // no-op in environments without console.table
    }
  }, [cellSymbol]);

  // Log initial snapshot once
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    logSnapshot(state, 'Estado inicial — tablero');
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { logSnapshot } as const;
}
