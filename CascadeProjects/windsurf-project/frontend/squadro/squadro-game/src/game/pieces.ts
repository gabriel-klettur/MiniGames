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
      pieceScale: 0.7, // default sprite scale relative to pitch basis
      boardScale: 1.0, // default board scale (100%)
      orientation: 'classic',
      showPieces: true,
      pieceAnimMs: 200,
      pieceRotateMs: 500,
      pieceWidthScaleLight: 1,
      pieceWidthScaleDark: 1,
      showCoordsOverlay: false,
      showPipIndicators: false,
      calibration: {
        originX: 0,
        originY: 0,
        pitchScaleX: 1,
        pitchScaleY: 1,
        showOverlay: false,
      },
    },
    ai: {
      enabled: false,
      aiSide: 'Dark',
      difficulty: 3,
      timeMode: 'manual',
      timeSeconds: 10,
      useWorkers: true,
      // Default evaluation weights per player
      evalWeights: {
        Light: { w_race: 1.0, w_clash: 0.8, w_sprint: 0.6, w_block: 0.3, done_bonus: 5.0, sprint_threshold: 2, tempo: 5 },
        Dark:  { w_race: 1.0, w_clash: 0.8, w_sprint: 0.6, w_block: 0.3, done_bonus: 5.0, sprint_threshold: 2, tempo: 5 },
      },
    },
  };
  return state;
}

