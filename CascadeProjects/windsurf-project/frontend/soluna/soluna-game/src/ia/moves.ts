import type { GameState, Tower } from '../game/types';
import { anyValidMoves, canMerge, findById, mergeTowers, replaceAfterMerge } from '../game/rules';
import { computeStateKey, towerZKey, playerZKey, flagsZKey, lastMoverZKey } from './hash';

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

  // Compute incremental Zobrist-like key
  const prevZ = (state as any).zKey as bigint | undefined;
  let z = typeof prevZ === 'bigint' ? prevZ : computeStateKey(state);
  // Toggle player
  z ^= playerZKey(state.currentPlayer);
  z ^= playerZKey(nextPlayer);
  // Remove old towers and add merged tower
  z ^= towerZKey(source);
  z ^= towerZKey(target);
  z ^= towerZKey(merged);

  if (!nextHasMoves) {
    const winner = state.currentPlayer as Player;
    const newStars = state.players[winner].stars + 1;
    const players = {
      ...state.players,
      [winner]: { stars: newStars },
    } as GameState['players'];
    const gameOver = newStars >= 4;
    // Update flags and last mover in zKey
    z ^= flagsZKey(state.roundOver, state.gameOver);
    z ^= flagsZKey(true, gameOver);
    z ^= lastMoverZKey(state.lastMover ?? 0);
    z ^= lastMoverZKey(winner);
    const nextState: GameState = {
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
    (nextState as any).zKey = z;
    return nextState;
  }

  const nextState: GameState = {
    ...state,
    towers,
    selectedId: null,
    currentPlayer: nextPlayer,
  };
  (nextState as any).zKey = z;
  return nextState;
}
