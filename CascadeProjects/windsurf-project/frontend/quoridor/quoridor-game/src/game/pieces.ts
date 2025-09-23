import type { Coord, GameState, Player, Wall } from './types.ts';
import { canMoveTo, otherPlayer, validateWallPlacement } from './rules.ts';

export function initialState(size = 9): GameState {
  const mid = Math.floor(size / 2);
  return {
    size,
    pawns: {
      L: { row: size - 1, col: mid },
      D: { row: 0, col: mid },
    },
    walls: [],
    wallsLeft: { L: 10, D: 10 },
    current: 'L',
  };
}

export function applyMovePawn(state: GameState, player: Player, dest: Coord): GameState {
  if (player !== state.current) return state; // no es tu turno
  if (!canMoveTo(state, player, dest)) return state; // movimiento ilegal
  const next: GameState = {
    ...state,
    pawns: { ...state.pawns, [player]: { row: dest.row, col: dest.col } },
    current: otherPlayer(state.current),
  };
  // Nota: La condición de victoria puede manejarse externamente; aquí solo avanzamos turno.
  // Ejemplo simple (comentado):
  // if (dest.row === goalRow(state.size, player)) { /* marcar ganador en un futuro */ }
  return next;
}

export function applyPlaceWall(state: GameState, player: Player, wall: Wall): GameState {
  if (player !== state.current) return state;
  if (state.wallsLeft[player] <= 0) return state;
  if (!validateWallPlacement(state, wall)) return state;
  return {
    ...state,
    walls: [...state.walls, { ...wall, by: player }],
    wallsLeft: { ...state.wallsLeft, [player]: state.wallsLeft[player] - 1 },
    current: otherPlayer(state.current),
  };
}

