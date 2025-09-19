import { Board } from '../board';
import type { PlayerId } from '../types';

/**
 * Determina si un jugador tiene al menos una acción legal disponible
 * (colocar desde reserva o trepar) dados el tablero y su reserva restante.
 */
export function hasAnyAction(board: Board, player: PlayerId, reserveRemaining: number): boolean {
  // 1) Colocación desde reserva
  if (reserveRemaining > 0 && board.validMoves().length > 0) return true;

  // 2) Trepar desde cualquier canica libre a un destino válido de capa superior
  const free = board.freeMarbles(player);
  if (free.length === 0) return false;
  const places = board.validMoves();
  for (const src of free) {
    for (const dst of places) {
      if (dst.layer > src.layer) return true;
    }
  }
  return false;
}
