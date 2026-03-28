import { describe, it, expect } from 'vitest';
import type { GameState, Player, Piece, Lane } from '../src/game/types';
import { findBestMove } from '../src/ia/search';

function makeZeroSpeedLane(length: number): Lane {
  return { length, speedOut: 0, speedBack: 0 } as Lane;
}

function makeRepetitionState(turn: Player = 'Light'): GameState {
  const length = 3;
  // Build 5 lanes per side; only lane 0 is used and has zero speeds
  const lanesLight: Lane[] = [makeZeroSpeedLane(length), makeZeroSpeedLane(length), makeZeroSpeedLane(length), makeZeroSpeedLane(length), makeZeroSpeedLane(length)];
  const lanesDark: Lane[] = [makeZeroSpeedLane(length), makeZeroSpeedLane(length), makeZeroSpeedLane(length), makeZeroSpeedLane(length), makeZeroSpeedLane(length)];

  const pieces: Piece[] = [];
  // Light pieces: L0 active en_ida at pos 0; others retired
  for (let i = 0; i < 5; i++) {
    if (i === 0) pieces.push({ id: `L${i}`, owner: 'Light', laneIndex: i, pos: 0, state: 'en_ida' });
    else pieces.push({ id: `L${i}`, owner: 'Light', laneIndex: i, pos: 0, state: 'retirada' });
  }
  // Dark pieces: D0 active en_ida at pos 0; others retired
  for (let i = 0; i < 5; i++) {
    if (i === 0) pieces.push({ id: `D${i}`, owner: 'Dark', laneIndex: i, pos: 0, state: 'en_ida' });
    else pieces.push({ id: `D${i}`, owner: 'Dark', laneIndex: i, pos: 0, state: 'retirada' });
  }

  const gs: GameState = {
    lanesByPlayer: {
      Light: lanesLight,
      Dark: lanesDark,
    },
    pieces,
    turn,
    ui: { pieceWidth: 10, pieceHeight: 10, orientation: 'classic' },
  } as any;
  return gs;
}

describe('repetition detection: 2-ply loop yields drawScore', () => {
  it('returns drawScore (=0 by default) when path repeats state+turn', async () => {
    const gs = makeRepetitionState('Light');
    const res = await findBestMove(gs, { maxDepth: 4, timeLimitMs: 5, engine: { /* use defaults with drawScore=0 */ } });
    expect(res.score).toBe(0);
    // Only move available is the zero-speed piece
    expect(res.moveId).toBe('L0');
  });
});
