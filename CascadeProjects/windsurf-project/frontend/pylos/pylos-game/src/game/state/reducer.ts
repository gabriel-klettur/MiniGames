import type { Cell } from '../types';
import type { GameAction } from './actions';
import type { PylosState } from './types';
import { createInitialState } from './types';
import { squaresCreatedBy, linesCreatedBy } from '../rules/scoring';
import { hasAnyAction } from '../rules/availability';

function switchTurn(state: PylosState): PylosState {
  const next: PylosState = { ...state, currentPlayer: state.currentPlayer === 1 ? 2 : 1, subphase: 'ACTION', removalsAllowed: 0, lastMoveDestination: null };
  return checkUnavailabilityLoss(next);
}

function checkApexEnd(state: PylosState): PylosState {
  if (state.board.isApexFilled()) {
    return { ...state, phase: 'ENDED', winner: state.board.lastPlayerToMove };
  }
  return state;
}

function checkUnavailabilityLoss(state: PylosState): PylosState {
  if (state.phase !== 'PLAYING') return state;
  const cur = state.currentPlayer;
  const placed = state.board.countPlayerMarbles()[cur] ?? 0;
  const reserveRemaining = Math.max(0, 15 - placed);
  if (!hasAnyAction(state.board, cur, reserveRemaining)) {
    return { ...state, phase: 'ENDED', winner: cur === 1 ? 2 : 1 };
  }
  return state;
}

function postActionSquareAndPhase(state: PylosState): PylosState {
  let next = checkApexEnd(state);
  if (next.phase !== 'PLAYING') return next;
  let formedSquare = 0;
  let formedLine = 0;
  if (next.lastMoveDestination) {
    formedSquare = squaresCreatedBy(next.board, next.currentPlayer, next.lastMoveDestination);
    formedLine = linesCreatedBy(next.board, next.currentPlayer, next.lastMoveDestination);
  }
  if (next.allowSquareRemoval && (formedSquare > 0 || formedLine > 0)) {
    return { ...next, removalsAllowed: 2, removalsTaken: 0, subphase: 'REMOVAL' };
  } else {
    return switchTurn(next);
  }
}

function attemptPlace(state: PylosState, cell: Cell): PylosState {
  if (state.phase !== 'PLAYING' || state.subphase !== 'ACTION') return state;
  const placed = state.board.countPlayerMarbles()[state.currentPlayer] ?? 0;
  if (15 - placed <= 0) return state;
  const b = state.board.clone();
  if (!b.place(state.currentPlayer, cell)) return state;
  const next: PylosState = { ...state, board: b, lastMoveDestination: cell };
  return postActionSquareAndPhase(next);
}

function attemptClimb(state: PylosState, src: Cell, dst: Cell): PylosState {
  if (state.phase !== 'PLAYING' || state.subphase !== 'ACTION') return state;
  const b = state.board.clone();
  if (!b.move(state.currentPlayer, src, dst)) return state;
  const next: PylosState = { ...state, board: b, lastMoveDestination: dst };
  return postActionSquareAndPhase(next);
}

function removeOwnFree(state: PylosState, cell: Cell): PylosState {
  if (state.phase !== 'PLAYING' || state.subphase !== 'REMOVAL') return state;
  if (state.removalsAllowed <= 0) return state;
  if (state.board.get(cell) !== state.currentPlayer) return state;
  if (!state.board.isFree(cell)) return state;
  const b = state.board.clone();
  const removed = b.removeAt(cell);
  if (removed !== state.currentPlayer) return state;
  const next: PylosState = {
    ...state,
    board: b,
    removalsAllowed: state.removalsAllowed - 1,
    removalsTaken: state.removalsTaken + 1,
  };
  if (next.removalsAllowed === 0) return finishRemoval(next);
  return next;
}

function finishRemoval(state: PylosState): PylosState {
  if (state.phase !== 'PLAYING' || state.subphase !== 'REMOVAL') return state;
  // En Experto: se deben retirar 1 o 2 si es posible; permitir finalizar si ya retiró >=1 o si no hay libres
  if (state.removalsAllowed > 0 && state.removalsTaken === 0) {
    const anyFree = state.board.freeMarbles(state.currentPlayer).length > 0;
    if (anyFree) return state;
  }
  return switchTurn(state);
}

export function reducer(state: PylosState, action: GameAction): PylosState {
  switch (action.type) {
    case 'PLACE':
      return attemptPlace(state, action.cell);
    case 'CLIMB':
      return attemptClimb(state, action.src, action.dst);
    case 'REMOVE':
      return removeOwnFree(state, action.cell);
    case 'FINISH_REMOVAL':
      return finishRemoval(state);
    case 'RESET':
      return createInitialState(action.expertMode ?? state.allowSquareRemoval);
    case 'SET_EXPERT_MODE':
      return { ...state, allowSquareRemoval: action.value };
    default:
      return state;
  }
}
