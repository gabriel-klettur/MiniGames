import { useMemo } from 'react';
import type { GameState } from '../../game/types';
import { isGameOver } from '../../game/rules';
import type { MoveEntry } from '../usePersistence';

export function useWinnerMessage(gameOver: string | undefined, state: GameState, _moves: MoveEntry[], vsAI: null | { enemy: 'L' | 'D'; depth: number }): string {
  return useMemo(() => {
    if (!gameOver) return '';
    const over = isGameOver(state);
    if (!over.over || !over.winner) return '';
    if (vsAI) {
      const label = over.winner === vsAI.enemy ? 'IA' : 'Tú';
      try { console.info('[winnerMessage] VsAI mode', { winner: over.winner, enemy: vsAI.enemy, label }); } catch {}
      return `Ganador: ${label}`;
    }
    try { console.info('[winnerMessage] Non VsAI mode (human vs human)', { winner: over.winner }); } catch {}
    return 'Ganador: Tú';
  }, [gameOver, state, vsAI]);
}
