import type { GameState, Piece } from './types';
import { PLAYERS } from './types';
import { STARTING_PLAYER } from './types';
import { createDefaultLanesByPlayer } from './board';

export function createInitialPieces(): Piece[] {
  const pieces: Piece[] = [];
  const laneCount = 5;
  for (const owner of PLAYERS) {
    for (let i = 0; i < laneCount; i++) {
      pieces.push({
        id: `${owner[0]}${i}`,
        owner,
        laneIndex: i,
        pos: 0,
        state: 'en_ida',
      });
    }
  }
  return pieces;
}

export function createInitialState(): GameState {
  const lanesByPlayer = createDefaultLanesByPlayer();
  const pieces = createInitialPieces();
  const state: GameState = {
    lanesByPlayer,
    pieces,
    turn: STARTING_PLAYER,
    winner: undefined,
    ui: {
      pieceWidth: 16, // default thinner width in px
      pieceHeight: 44, // default height in px
      orientation: 'classic',
    },
  };
  return state;
}

