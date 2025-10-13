import { describe, it, expect } from 'vitest';
import type { GameState, Player, Piece } from '../src/game/types';
import { createDefaultLanesByPlayer, DEFAULT_LANE_LENGTH } from '../src/game/board';
import { evaluate } from '../src/ia/evaluate';

function makeEmptyState(turn: Player = 'Light'): GameState {
  const lanesByPlayer = createDefaultLanesByPlayer(DEFAULT_LANE_LENGTH);
  // place 5 pieces per side at start edges (en_ida, pos=0)
  const pieces: Piece[] = [];
  for (let i = 0; i < 5; i++) {
    pieces.push({ id: `L${i}`, owner: 'Light', laneIndex: i, pos: 0, state: 'en_ida' });
  }
  for (let i = 0; i < 5; i++) {
    pieces.push({ id: `D${i}`, owner: 'Dark', laneIndex: i, pos: 0, state: 'en_ida' });
  }
  return {
    lanesByPlayer,
    pieces,
    turn,
    ui: {
      pieceWidth: 10,
      pieceHeight: 10,
      orientation: 'classic',
    },
  } as GameState;
}

describe('evaluate: race top-4 (doc scale)', () => {
  it('Light ahead by ~1 tempo should yield ~+100 delta vs Dark perspective', () => {
    const gs = makeEmptyState('Light');
    // Advance one Light piece by one of its out speeds to reduce Light top-4 by ~1 action
    const p = gs.pieces.find(x => x.id === 'L0')!;
    const lane = gs.lanesByPlayer[p.owner][p.laneIndex];
    p.pos = Math.min(lane.length, p.pos + lane.speedOut); // one action forward

    const sLight = evaluate(gs, 'Light');
    const sDark = evaluate(gs, 'Dark');
    // Light perspective should be higher than Dark's (since Light is ahead)
    expect(sLight).toBeGreaterThan(sDark);
    // sanity: significant positive
    expect(sLight).toBeGreaterThan(20);
  });
});
