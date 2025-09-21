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
 * Devuelve la lista de celdas legales a las que el jugador puede mover su peón.
 * Reglas incluidas: movimiento ortogonal de 1 y salto cara a cara si el rival está adyacente
 * sin valla intermedia. (Diagonal lateral al estar bloqueado: TODO si se requiere.)
 */
export function legalPawnMoves(state: GameState, player: Player = state.current): Coord[] {
  const { size, pawns, walls } = state;
  const me = pawns[player];
  const op = pawns[otherPlayer(player)];

  const nbs = neighbors(size, me.row, me.col, walls);

  // ¿El rival está justo en una casilla ortogonal accesible?
  const isOppAdjacent = nbs.some((c) => c.row === op.row && c.col === op.col);
  if (isOppAdjacent) {
    // Vector desde mí hacia el rival
    const dr = op.row - me.row;
    const dc = op.col - me.col;
    const jr = op.row + dr;
    const jc = op.col + dc;
    // Salto al otro lado si está dentro de tablero y no hay valla entre rival y celda destino
    if (inBounds(size, jr, jc)) {
      const opNbs = neighbors(size, op.row, op.col, walls);
      if (opNbs.some((c) => c.row === jr && c.col === jc)) {
        return [{ row: jr, col: jc }];
      }
    }
    // Si no se puede saltar recto (p.ej. pared detrás), por ahora no permitimos diagonal lateral.
    return [];
  }

  // Si el rival no está ocupado en una vecina, podemos movernos a cualquiera de ellas, salvo la ocupada por el rival
  return nbs.filter((c) => !(c.row === op.row && c.col === op.col));
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

