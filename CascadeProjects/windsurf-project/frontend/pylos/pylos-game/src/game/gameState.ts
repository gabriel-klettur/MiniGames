import { Board } from './board';
import type { Cell, PlayerId, GamePhase, TurnSubphase } from './types';

export const TOTAL_MARBLES_PER_PLAYER = 15;

export class GameState {
  board: Board = new Board();
  currentPlayer: PlayerId = 1;
  phase: GamePhase = 'PLAYING';
  subphase: TurnSubphase = 'ACTION';
  winner: PlayerId | null = null;
  removalsAllowed = 0;
  removalsTaken = 0;
  lastMoveDestination: Cell | null = null;
  allowSquareRemoval = true; // Niño=false; Experto=true

  reset(): void {
    this.board = new Board();
    this.currentPlayer = 1;
    this.phase = 'PLAYING';
    this.subphase = 'ACTION';
    this.winner = null;
    this.removalsAllowed = 0;
    this.removalsTaken = 0;
    this.lastMoveDestination = null;
    this.allowSquareRemoval = true;
  }

  clone(): GameState {
    const g = new GameState();
    g.board = this.board.clone();
    g.currentPlayer = this.currentPlayer;
    g.phase = this.phase;
    g.subphase = this.subphase;
    g.winner = this.winner;
    g.removalsAllowed = this.removalsAllowed;
    g.removalsTaken = this.removalsTaken;
    g.lastMoveDestination = this.lastMoveDestination ? { ...this.lastMoveDestination } : null;
    g.allowSquareRemoval = this.allowSquareRemoval;
    return g;
  }

  private switchTurn(): void {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    this.subphase = 'ACTION';
    this.removalsAllowed = 0;
    this.lastMoveDestination = null;
    this.checkUnavailabilityLoss();
  }

  checkEndConditions(): void {
    if (this.board.isApexFilled()) {
      this.phase = 'ENDED';
      this.winner = this.board.lastPlayerToMove;
      return;
    }
    this.checkUnavailabilityLoss();
  }

  private hasAnyAction(player: PlayerId): boolean {
    // Placement from reserve
    if (this.reserveRemaining(player) > 0 && this.board.validMoves().length > 0) return true;
    // Climb from any free marble to any higher valid destination
    const free = this.board.freeMarbles(player);
    if (free.length === 0) return false;
    const places = this.board.validMoves();
    for (const src of free) {
      for (const dst of places) {
        if (dst.layer > src.layer) return true;
      }
    }
    return false;
  }

  private checkUnavailabilityLoss(): void {
    if (this.phase !== 'PLAYING') return;
    const cur = this.currentPlayer;
    if (!this.hasAnyAction(cur)) {
      this.phase = 'ENDED';
      this.winner = cur === 1 ? 2 : 1;
    }
  }

  attemptPlace(cell: Cell): boolean {
    if (this.phase !== 'PLAYING' || this.subphase !== 'ACTION') return false;
    if (this.reserveRemaining(this.currentPlayer) <= 0) return false;
    if (!this.board.place(this.currentPlayer, cell)) return false;
    this.lastMoveDestination = cell;
    this.postActionSquareAndPhase();
    return true;
  }

  attemptClimb(src: Cell, dst: Cell): boolean {
    if (this.phase !== 'PLAYING' || this.subphase !== 'ACTION') return false;
    if (!this.board.move(this.currentPlayer, src, dst)) return false;
    this.lastMoveDestination = dst;
    this.postActionSquareAndPhase();
    return true;
  }

  private postActionSquareAndPhase(): void {
    this.checkEndConditions();
    if (this.phase !== 'PLAYING') return;
    let formedSquare = 0;
    let formedLine = 0;
    if (this.lastMoveDestination) {
      formedSquare = this.board.squaresCreatedBy(this.currentPlayer, this.lastMoveDestination);
      formedLine = this.board.linesCreatedBy(this.currentPlayer, this.lastMoveDestination);
    }
    if (this.allowSquareRemoval && (formedSquare > 0 || formedLine > 0)) {
      this.removalsAllowed = 2;
      this.removalsTaken = 0;
      this.subphase = 'REMOVAL';
    } else {
      this.switchTurn();
    }
  }

  removeOwnFree(cell: Cell): boolean {
    if (this.phase !== 'PLAYING' || this.subphase !== 'REMOVAL') return false;
    if (this.removalsAllowed <= 0) return false;
    if (this.board.get(cell) !== this.currentPlayer) return false;
    if (!this.board.isFree(cell)) return false;
    const removed = this.board.removeAt(cell);
    if (removed === this.currentPlayer) {
      this.removalsTaken += 1;
      this.removalsAllowed -= 1;
      if (this.removalsAllowed === 0) this.finishRemoval();
      return true;
    }
    return false;
  }

  finishRemoval(): void {
    if (this.phase !== 'PLAYING' || this.subphase !== 'REMOVAL') return;
    // En Experto: se deben retirar 1 o 2 si es posible; permitir finalizar si ya retiró >=1 o si no hay libres
    if (this.removalsAllowed > 0 && this.removalsTaken === 0) {
      const anyFree = this.board.freeMarbles(this.currentPlayer).length > 0;
      if (anyFree) return;
    }
    this.switchTurn();
  }

  canFinishRemoval(): boolean {
    if (this.phase !== 'PLAYING' || this.subphase !== 'REMOVAL') return false;
    if (this.removalsAllowed > 0 && this.removalsTaken === 0) {
      const anyFree = this.board.freeMarbles(this.currentPlayer).length > 0;
      return !anyFree;
    }
    return true;
  }

  statusText(): string {
    if (this.phase === 'ENDED') {
      if (this.winner == null) return 'Game Over — Stalemate';
      return `Game Over — Player ${this.winner} wins!`;
    }
    if (this.subphase === 'REMOVAL') {
      const base = this.removalsTaken === 0 && this.removalsAllowed === 2 ?
        'remove 1-2 free marble(s)' : `remove up to ${this.removalsAllowed} free marble(s)`;
      return `Player ${this.currentPlayer}: ${base} (removed ${this.removalsTaken})`;
    }
    return `Player ${this.currentPlayer}: place or climb`;
  }

  reserveRemaining(player: PlayerId): number {
    const placed = this.board.countPlayerMarbles()[player] ?? 0;
    return Math.max(0, TOTAL_MARBLES_PER_PLAYER - placed);
  }
}
