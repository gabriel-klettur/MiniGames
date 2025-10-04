import type { GameState, Tower } from '../game/types';
import { anyValidMoves, canMerge, findById, mergeTowers, replaceAfterMerge } from '../game/rules';

export type Player = 1 | 2;

export type AIMove = {
  kind: 'merge';
  sourceId: string;
  targetId: string;
};

export function generateAllMoves(state: GameState): AIMove[] {
  const moves: AIMove[] = [];
  const towers = state.towers;
  for (let i = 0; i < towers.length; i++) {
    for (let j = 0; j < towers.length; j++) {
      if (i === j) continue;
      const a = towers[i];
      const b = towers[j];
      if (canMerge(a, b)) {
        moves.push({ kind: 'merge', sourceId: a.id, targetId: b.id });
      }
    }
  }
  return moves;
}

export function applyMove(state: GameState, mv: AIMove): GameState {
  if (mv.kind !== 'merge') return state;
  const source = findById(state.towers, mv.sourceId);
  const target = findById(state.towers, mv.targetId);
  if (!source || !target) return state;

  const merged: Tower = mergeTowers(source, target);
  const towers = replaceAfterMerge(state.towers, source.id, target.id, merged);

  // Check if next player has moves
  const nextPlayer: Player = state.currentPlayer === 1 ? 2 : 1;
  const nextHasMoves = anyValidMoves(towers);

  if (!nextHasMoves) {
    const winner = state.currentPlayer as Player;
    const newStars = state.players[winner].stars + 1;
    const players = {
      ...state.players,
      [winner]: { stars: newStars },
    } as GameState['players'];
    const gameOver = newStars >= 4;
    return {
      ...state,
      towers,
      selectedId: null,
      lastMover: winner,
      roundOver: true,
      // Al finalizar la ronda, avanzamos el turno al oponente para que la evaluación
      // terminal refleje correctamente que el rival no tiene movimientos.
      currentPlayer: nextPlayer,
      players,
      gameOver,
    };
  }

  return {
    ...state,
    towers,
    selectedId: null,
    currentPlayer: nextPlayer,
  };
}
