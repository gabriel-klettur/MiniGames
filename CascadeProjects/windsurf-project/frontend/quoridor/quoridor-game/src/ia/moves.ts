import type { GameState, Player, Wall } from '../game/types.ts';
import type { AIMove } from './types.ts';
import { legalPawnMoves, validateWallPlacement } from '../game/rules.ts';
import { applyMovePawn, applyPlaceWall } from '../game/pieces.ts';
import { goalRow } from '../game/rules.ts';
import type { SearchConfig } from './types.ts';

/** Generate all legal AI moves for the current player. */
export function generateMoves(state: GameState, config?: SearchConfig, atRoot = false): AIMove[] {
  const player: Player = state.current;
  const moves: AIMove[] = [];
  // Pawn moves first
  for (const c of legalPawnMoves(state, player)) {
    moves.push({ kind: 'pawn', to: { row: c.row, col: c.col } });
  }
  // Wall placements (if available)
  if (state.wallsLeft[player] > 0) {
    const N = state.size;
    let wallMoves: AIMove[] = [];
    for (let r = 0; r <= N - 2; r++) {
      for (let c = 0; c <= N - 2; c++) {
        const wH: Wall = { o: 'H', r, c } as const;
        if (validateWallPlacement(state, wH)) wallMoves.push({ kind: 'wall', wall: wH });
        const wV: Wall = { o: 'V', r, c } as const;
        if (validateWallPlacement(state, wV)) wallMoves.push({ kind: 'wall', wall: wV });
      }
    }
    // Limit number of walls to consider based on config
    const limit = config ? (atRoot ? config.maxWallsRoot : config.maxWallsNode) : Infinity;
    if (Number.isFinite(limit)) {
      wallMoves = wallMoves.slice(0, Math.max(0, limit as number));
    }
    moves.push(...wallMoves);
  }
  // Move ordering: prefer pawn moves that advance towards goal
  if (config?.enableMoveOrdering) {
    const targetRow = goalRow(state.size, player);
    const sign = targetRow < state.pawns[player].row ? -1 : 1; // movement direction
    moves.sort((a, b) => {
      // Pawn moves before walls
      if (a.kind !== b.kind) return a.kind === 'pawn' ? -1 : 1;
      if (a.kind === 'pawn' && b.kind === 'pawn') {
        const da = sign * (a.to.row - state.pawns[player].row);
        const db = sign * (b.to.row - state.pawns[player].row);
        return db - da; // descending: more progress first
      }
      return 0;
    });
  }
  return moves;
}

/** Apply an AI move, returning the next GameState (pure). */
export function applyAIMove(state: GameState, move: AIMove): GameState {
  if (move.kind === 'pawn') {
    return applyMovePawn(state, state.current, move.to);
  }
  return applyPlaceWall(state, state.current, move.wall);
}
