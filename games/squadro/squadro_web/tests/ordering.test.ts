import { describe, it, expect } from 'vitest';
import type { GameState, Player, Piece } from '../src/game/types';
import { createDefaultLanesByPlayer, DEFAULT_LANE_LENGTH } from '../src/game/board';
import { orderMoves, generateMoves } from '../src/ia/moves';

function makeStateWithFinisher(turn: Player = 'Light'): GameState {
  const lanesByPlayer = createDefaultLanesByPlayer(DEFAULT_LANE_LENGTH);
  const pieces: Piece[] = [];
  for (let i = 0; i < 5; i++) {
    pieces.push({ id: `L${i}`, owner: 'Light', laneIndex: i, pos: 0, state: 'en_ida' });
  }
  for (let i = 0; i < 5; i++) {
    pieces.push({ id: `D${i}`, owner: 'Dark', laneIndex: i, pos: 0, state: 'en_ida' });
  }
  // Put one Light piece ready to retire now (en_vuelta, pos=0)
  pieces[0].state = 'en_vuelta';
  pieces[0].pos = 0;
  return {
    lanesByPlayer,
    pieces,
    turn,
    ui: { pieceWidth: 10, pieceHeight: 10, orientation: 'classic' },
  } as GameState;
}

describe('orderMoves: finishing move prioritized', () => {
  it('puts the retiring move first', () => {
    const gs = makeStateWithFinisher('Light');
    const moves = generateMoves(gs);
    const ordered = orderMoves(gs, moves, 'Light');
    expect(ordered[0]).toBe('L0');
  });
});
