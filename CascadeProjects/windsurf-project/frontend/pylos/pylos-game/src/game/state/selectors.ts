import type { PylosState } from './types';
import { hasAnyAction } from '../rules/availability';
import { squaresCreatedBy, linesCreatedBy } from '../rules/scoring';
import type { Cell, PlayerId } from '../types';

export function reserveRemaining(state: PylosState, player: PlayerId): number {
  const placed = state.board.countPlayerMarbles()[player] ?? 0;
  return Math.max(0, 15 - placed); // TOTAL_MARBLES_PER_PLAYER = 15
}

export function canFinishRemoval(state: PylosState): boolean {
  if (state.phase !== 'PLAYING' || state.subphase !== 'REMOVAL') return false;
  if (state.removalsAllowed > 0 && state.removalsTaken === 0) {
    const anyFree = state.board.freeMarbles(state.currentPlayer).length > 0;
    return !anyFree;
  }
  return true;
}

export function statusText(state: PylosState): string {
  if (state.phase === 'ENDED') {
    if (state.winner == null) return 'Game Over — Stalemate';
    return `Game Over — Player ${state.winner} wins!`;
  }
  if (state.subphase === 'REMOVAL') {
    const base = state.removalsTaken === 0 && state.removalsAllowed === 2 ?
      'remove 1-2 free marble(s)' : `remove up to ${state.removalsAllowed} free marble(s)`;
    return `Player ${state.currentPlayer}: ${base} (removed ${state.removalsTaken})`;
  }
  return `Player ${state.currentPlayer}: place or climb`;
}

// Utilidades de reglas post-acción
export function formedStructuresAfter(state: PylosState, cell: Cell): { squares: number; lines: number } {
  const squares = squaresCreatedBy(state.board, state.currentPlayer, cell);
  const lines = linesCreatedBy(state.board, state.currentPlayer, cell);
  return { squares, lines };
}

export function hasAnyActionForCurrent(state: PylosState): boolean {
  return hasAnyAction(state.board, state.currentPlayer, reserveRemaining(state, state.currentPlayer));
}
