import type { GameState, Player, Wall } from '../game/types.ts';
import type { AIMove } from './types.ts';
import { legalPawnMoves, validateWallPlacement } from '../game/rules.ts';
import { applyMovePawn, applyPlaceWall } from '../game/pieces.ts';
import { goalRow } from '../game/rules.ts';
import type { SearchConfig } from './types.ts';
import { shortestDistanceToGoal, shortestPathToGoal } from './eval.ts';
import { telemetry } from './telemetry.ts';

/** Generate all legal AI moves for the current player. */
export function generateMoves(state: GameState, config?: SearchConfig, atRoot = false): AIMove[] {
  const tGenStart = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const player: Player = state.current;
  const moves: AIMove[] = [];
  // Helper: estimate if we are in opening phase
  const isOpening = (() => {
    const pliesMax = Math.max(0, config?.openingPliesMax ?? 6);
    const startRowL = state.size - 1;
    const startRowD = 0;
    const progL = Math.abs(state.pawns['L'].row - startRowL);
    const progD = Math.abs(state.pawns['D'].row - startRowD);
    const plyEstimate = state.walls.length + progL + progD;
    return plyEstimate <= pliesMax;
  })();
  const opening = config?.openingStrategy;
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
        {
          const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          const ok = validateWallPlacement(state, wH);
          const dt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
          telemetry.addValidateWall(dt);
          if (ok && nearOpPath(wH)) {
          const ns = applyPlaceWall(state, player, wH);
          const dMe1 = shortestDistanceToGoal(ns, me);
          const dOp1 = shortestDistanceToGoal(ns, op);
          let merit = (dOp1 - dOp0) - LAMBDA * (dMe1 - dMe0);
          // Opening bonuses for walls
          if (isOpening) {
            const mid = Math.floor((N - 1) / 2);
            const nearCenterBonus = - (Math.abs(r - mid) + Math.abs(c - mid)) * 0.05; // closer to center -> smaller penalty
            if (opening === 'defensive') merit += 0.5 + nearCenterBonus;
            else if (opening === 'central_control') merit += 0.25 + nearCenterBonus;
            else if (opening === 'early_block') {
              // Bonus if wall is adjacent to opponent and perpendicular to their advance direction
              const opPos = state.pawns[op];
              const opGoalRow = goalRow(N, op);
              const dir = opGoalRow > opPos.row ? 1 : -1; // down or up
              const blocksForward = (wH.o === 'H') && (r === opPos.row + (dir > 0 ? 0 : -1)) && (c === opPos.col || c === opPos.col - 1);
              if (blocksForward) merit += 1.0;
            }
            // racing/mirror: no special wall boost
          }
          wallScored.push({ move: { kind: 'wall', wall: wH }, merit });
          }
        }
        const wV: Wall = { o: 'V', r, c } as const;
        {
          const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          const ok = validateWallPlacement(state, wV);
          const dt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
          telemetry.addValidateWall(dt);
          if (ok && nearOpPath(wV)) {
          const ns = applyPlaceWall(state, player, wV);
          const dMe1 = shortestDistanceToGoal(ns, me);
          const dOp1 = shortestDistanceToGoal(ns, op);
          let merit = (dOp1 - dOp0) - LAMBDA * (dMe1 - dMe0);
          if (isOpening) {
            const mid = Math.floor((N - 1) / 2);
            const nearCenterBonus = - (Math.abs(r - mid) + Math.abs(c - mid)) * 0.05;
            if (opening === 'defensive') merit += 0.5 + nearCenterBonus;
            else if (opening === 'central_control') merit += 0.25 + nearCenterBonus;
            else if (opening === 'early_block') {
              const opPos = state.pawns[op];
              // Vertical walls do not block straight forward directly; small bonus if very near
              const near = Math.abs(r - opPos.row) + Math.abs(c - opPos.col) <= 1 ? 0.3 : 0;
              merit += near;
            }
          }
          wallScored.push({ move: { kind: 'wall', wall: wV }, merit });
          }
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

  // Opening-specific ordering tweaks
  if (isOpening && opening) {
    const N = state.size;
    const mid = Math.floor(N / 2);
    const op: Player = player === 'L' ? 'D' : 'L';
    const opPos = state.pawns[op];
    const targetRow = goalRow(N, player);
    const sign = targetRow < state.pawns[player].row ? -1 : 1;

    const scoreMove = (m: AIMove): number => {
      let s = 0;
      if (m.kind === 'pawn') {
        const progress = sign * (m.to.row - state.pawns[player].row);
        if (opening === 'racing') {
          s += 2.0 * progress;
        } else if (opening === 'central_control') {
          const centerBias = -Math.abs(m.to.col - mid) * 0.5;
          s += 1.2 * progress + centerBias;
        } else if (opening === 'mirror') {
          const colMatch = -Math.abs(m.to.col - opPos.col);
          s += 1.0 * progress + 0.8 * colMatch;
        } else if (opening === 'defensive') {
          // Slightly deprioritize pawn moves
          s += 0.2 * progress - 1.0;
        } else if (opening === 'early_block') {
          // Neutral for pawn; walls will get boosted above
          s += 0.3 * progress - 0.5;
        }
      } else {
        // Walls
        if (opening === 'defensive') s += 2.0;
        else if (opening === 'central_control') s += 0.8;
        else if (opening === 'early_block') {
          // Favor walls very near opponent
          const near = Math.abs(m.wall.r - opPos.row) + Math.abs(m.wall.c - opPos.col);
          s += 1.5 - 0.3 * near;
        }
        // racing/mirror: no extra wall score
      }
      return s;
    };

    moves.sort((a, b) => scoreMove(b) - scoreMove(a));
  }
  const tGenEnd = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  telemetry.addGenerateMoves(tGenEnd - tGenStart);
  return moves;
}

/** Apply an AI move, returning the next GameState (pure). */
export function applyAIMove(state: GameState, move: AIMove): GameState {
  if (move.kind === 'pawn') {
    return applyMovePawn(state, state.current, move.to);
  }
  return applyPlaceWall(state, state.current, move.wall);
}
