import type { GameState, Player, Wall } from '../game/types.ts';
import type { AIMove } from './types.ts';
import { legalPawnMoves, validateWallPlacement } from '../game/rules.ts';
import { applyMovePawn, applyPlaceWall } from '../game/pieces.ts';
import { goalRow } from '../game/rules.ts';
import type { SearchConfig } from './types.ts';
import { shortestDistanceToGoal, shortestPathToGoal } from './eval.ts';

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
    // Baseline distances to evaluate deltas
    const me = player;
    const op: Player = me === 'L' ? 'D' : 'L';
    const dMe0 = shortestDistanceToGoal(state, me);
    const dOp0 = shortestDistanceToGoal(state, op);
    // Peso de penalización para aumentar nuestra propia distancia (ajustable en el futuro)
    const LAMBDA = (config && typeof config.wallMeritLambda === 'number') ? config.wallMeritLambda : 0.6;
    // Ruta mínima del oponente (para filtrar cerca de ella)
    const opPath = config?.enableWallPathFilter ? shortestPathToGoal(state, op) : [];
    const radius = Math.max(0, config?.wallPathRadius ?? 0);
    const nearOpPath = (w: Wall): boolean => {
      if (!opPath.length) return true; // sin filtro si no hay ruta
      // Celdas adyacentes que toca la valla
      const cells: Array<{ row: number; col: number }> =
        w.o === 'H'
          ? [{ row: w.r, col: w.c }, { row: w.r + 1, col: w.c }]
          : [{ row: w.r, col: w.c }, { row: w.r, col: w.c + 1 }];
      const manhattan = (a: { row: number; col: number }, b: { row: number; col: number }) =>
        Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
      for (const cp of opPath) {
        for (const cell of cells) {
          if (manhattan(cell, cp) <= radius) return true;
        }
      }
      return false;
    };
    let wallScored: Array<{ move: AIMove; merit: number } > = [];
    for (let r = 0; r <= N - 2; r++) {
      for (let c = 0; c <= N - 2; c++) {
        const wH: Wall = { o: 'H', r, c } as const;
        if (validateWallPlacement(state, wH) && nearOpPath(wH)) {
          const ns = applyPlaceWall(state, player, wH);
          const dMe1 = shortestDistanceToGoal(ns, me);
          const dOp1 = shortestDistanceToGoal(ns, op);
          const merit = (dOp1 - dOp0) - LAMBDA * (dMe1 - dMe0);
          wallScored.push({ move: { kind: 'wall', wall: wH }, merit });
        }
        const wV: Wall = { o: 'V', r, c } as const;
        if (validateWallPlacement(state, wV) && nearOpPath(wV)) {
          const ns = applyPlaceWall(state, player, wV);
          const dMe1 = shortestDistanceToGoal(ns, me);
          const dOp1 = shortestDistanceToGoal(ns, op);
          const merit = (dOp1 - dOp0) - LAMBDA * (dMe1 - dMe0);
          wallScored.push({ move: { kind: 'wall', wall: wV }, merit });
        }
      }
    }
    // Ordenar por mérito descendente y truncar a top-K
    wallScored.sort((a, b) => b.merit - a.merit);
    const limit = config ? (atRoot ? config.maxWallsRoot : config.maxWallsNode) : Infinity;
    const selected = Number.isFinite(limit) ? wallScored.slice(0, Math.max(0, limit as number)) : wallScored;
    moves.push(...selected.map(ws => ws.move));
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
