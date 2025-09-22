import type { GameState, Player, Coord } from '../game/types.ts';
import { goalRow } from '../game/rules.ts';
import { neighbors } from '../game/board.ts';

function key(c: Coord) { return `${c.row},${c.col}`; }

export function shortestDistanceToGoal(state: GameState, player: Player): number {
  const targetRow = goalRow(state.size, player);
  const start = state.pawns[player];
  if (start.row === targetRow) return 0;
  const q: Array<{ c: Coord; d: number }> = [{ c: start, d: 0 }];
  const seen = new Set<string>([key(start)]);
  while (q.length) {
    const { c, d } = q.shift()!;
    for (const nb of neighbors(state.size, c.row, c.col, state.walls)) {
      const k = key(nb);
      if (seen.has(k)) continue;
      if (nb.row === targetRow) return d + 1;
      seen.add(k);
      q.push({ c: nb, d: d + 1 });
    }
  }
  // Si no hay camino (no debería ocurrir por nuestras validaciones), devolver un número grande
  return 1e9;
}

/**
 * Heurística simple: ventaja en distancia a meta + peso por vallas restantes.
 * Score positivo favorece a rootPlayer.
 */
export function evaluate(state: GameState, rootPlayer: Player): number {
  const me = rootPlayer;
  const op: Player = me === 'L' ? 'D' : 'L';

  // Victoria inmediata
  if (state.pawns[me].row === goalRow(state.size, me)) return 1000;
  if (state.pawns[op].row === goalRow(state.size, op)) return -1000;

  const dMe = shortestDistanceToGoal(state, me);
  const dOp = shortestDistanceToGoal(state, op);
  // Menor distancia es mejor, por eso usamos (dOp - dMe)
  let score = (dOp - dMe);

  // Bonificación por vallas restantes (tener más vallas es ventajoso a futuro)
  const wMe = state.wallsLeft[me];
  const wOp = state.wallsLeft[op];
  score += (wMe - wOp) * 0.25;

  return score;
}
