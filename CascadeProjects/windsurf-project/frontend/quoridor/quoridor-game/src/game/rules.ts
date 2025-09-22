import type { Coord, GameState, Player, Wall } from './types.ts';
import { neighbors, hasPathToRow } from './board.ts';
import { canPlaceWallBasic } from './walls.ts';

const inBounds = (size: number, r: number, c: number) => r >= 0 && r < size && c >= 0 && c < size;

export function otherPlayer(p: Player): Player {
  return p === 'L' ? 'D' : 'L';
}

export function goalRow(size: number, p: Player): number {
  return p === 'L' ? 0 : size - 1;
}

/**
 * Devuelve las casillas legales para mover el peón del jugador.
 * Reglas implementadas (Quoridor):
 *  - Movimiento ortogonal de 1 casilla (arriba/abajo/izquierda/derecha) si no hay valla entre medias.
 *  - Si el rival está adyacente ortogonalmente y no hay valla en medio:
 *      a) Se puede saltar recto al otro lado del rival si la casilla existe y no hay valla entre rival y destino.
 *      b) Si el salto recto está bloqueado por valla o borde, se permiten los dos movimientos diagonales alrededor del rival
 *         (si existe conexión entre el rival y dichas casillas).
 *  - Además, aunque el rival esté adyacente, siguen siendo válidos los otros movimientos ortogonales que no invaden su casilla.
 */
export function legalPawnMoves(state: GameState, player: Player = state.current): Coord[] {
  const { size, pawns, walls } = state;
  const me = pawns[player];
  const op = pawns[otherPlayer(player)];

  // Vecinos ortogonales del jugador (respetando vallas)
  const nbs = neighbors(size, me.row, me.col, walls);

  // Punto de partida: todos los vecinos que no están ocupados por el rival
  const res: Coord[] = nbs.filter((c) => !(c.row === op.row && c.col === op.col));

  // ¿El rival está justo en una vecina accesible?
  const isOppAdjacent = nbs.some((c) => c.row === op.row && c.col === op.col);
  if (!isOppAdjacent) return res;

  // Vector desde mí hacia el rival
  const dr = op.row - me.row;
  const dc = op.col - me.col;
  const jr = op.row + dr;
  const jc = op.col + dc;

  // Vecinos del rival (respetando vallas)
  const opNbs = neighbors(size, op.row, op.col, walls);

  // Caso (a): salto recto si la casilla detrás del rival es accesible desde el rival
  if (inBounds(size, jr, jc) && opNbs.some((c) => c.row === jr && c.col === jc)) {
    res.push({ row: jr, col: jc });
    return res;
  }

  // Caso (b): salto diagonal (dos laterales) si el salto recto está bloqueado
  // Si estamos alineados verticalmente (dr != 0), laterales son izquierda/derecha del rival
  // Si estamos alineados horizontalmente (dc != 0), laterales son arriba/abajo del rival
  if (dr !== 0) {
    for (const cand of [
      { row: op.row, col: op.col - 1 },
      { row: op.row, col: op.col + 1 },
    ]) {
      if (opNbs.some((c) => c.row === cand.row && c.col === cand.col)) res.push(cand);
    }
  } else if (dc !== 0) {
    for (const cand of [
      { row: op.row - 1, col: op.col },
      { row: op.row + 1, col: op.col },
    ]) {
      if (opNbs.some((c) => c.row === cand.row && c.col === cand.col)) res.push(cand);
    }
  }

  return res;
}

export function canMoveTo(state: GameState, player: Player, dest: Coord): boolean {
  return legalPawnMoves(state, player).some((c) => c.row === dest.row && c.col === dest.col);
}

/**
 * Valida la colocación de una valla: comprobaciones locales (rango/solape/cruce)
 * y además que ambos jugadores mantienen al menos un camino a su meta.
 */
export function validateWallPlacement(state: GameState, cand: Wall): boolean {
  const { size, walls, pawns } = state;
  if (!canPlaceWallBasic(size, walls, cand)) return false;

  const nextWalls = [...walls, cand];
  // El jugador L debe poder alcanzar la última fila; D debe poder alcanzar la primera
  const okL = hasPathToRow(size, nextWalls, pawns['L'], goalRow(size, 'L'));
  const okD = hasPathToRow(size, nextWalls, pawns['D'], goalRow(size, 'D'));
  return okL && okD;
}

