import { Board } from '../board';
import type { Cell, GamePhase, PlayerId, TurnSubphase } from '../types';

export interface PylosState {
  board: Board;
  currentPlayer: PlayerId;
  phase: GamePhase;
  subphase: TurnSubphase;
  winner: PlayerId | null;
  removalsAllowed: number;
  removalsTaken: number;
  lastMoveDestination: Cell | null;
  allowSquareRemoval: boolean;
}

export function createInitialState(expert: boolean = true): PylosState {
  return {
    board: new Board(),
    currentPlayer: 1,
    phase: 'PLAYING',
    subphase: 'ACTION',
    winner: null,
    removalsAllowed: 0,
    removalsTaken: 0,
    lastMoveDestination: null,
    allowSquareRemoval: expert,
  };
}
