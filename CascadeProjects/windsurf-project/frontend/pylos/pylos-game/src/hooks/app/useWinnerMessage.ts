import { useMemo } from 'react';
import type { GameState } from '../../game/types';
import { isGameOver } from '../../game/rules';
import type { MoveEntry } from '../usePersistence';

export function useWinnerMessage(gameOver: string | undefined, state: GameState, moves: MoveEntry[], vsAI: null | { enemy: 'L' | 'D'; depth: number }): string {
  return useMemo(() => {
    if (!gameOver) return '';
    const over = isGameOver(state);
    if (!over.over || !over.winner) return '';
    if (vsAI) {
      const label = over.winner === vsAI.enemy ? 'IA' : 'Humano';
      try { console.info('[winnerMessage] VsAI mode', { winner: over.winner, enemy: vsAI.enemy, label }); } catch {}
      return `Ganador: ${label}`;
    }
    const last = moves.length > 0 ? moves[moves.length - 1] : null;
    let label: 'IA' | 'Humano' = 'Humano';
    if (last?.source === 'IA') label = 'IA';
    if (last?.source === 'AUTO') {
      const side = over.winner === 'L' ? 'Claras (L)' : 'Oscuras (D)';
      try { console.info('[winnerMessage] AUTO completion', { winner: over.winner, side }); } catch {}
      return `Ganador: ${side}`;
    }
    try { console.info('[winnerMessage] Non VsAI mode', { lastSource: last?.source, inferred: label, winner: over.winner }); } catch {}
    return `Ganador: ${label}`;
  }, [gameOver, state, vsAI, moves]);
}
