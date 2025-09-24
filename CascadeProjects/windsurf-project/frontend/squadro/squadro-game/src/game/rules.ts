import type { GameState, Lane, Piece, Player } from './types';

// Helper: opponent side
export function other(p: Player): Player {
  return p === 'Light' ? 'Dark' : 'Light';
}

// Helper: get piece by id (throws if not found)
export function getPiece(gs: GameState, id: string): Piece {
  const p = gs.pieces.find((x) => x.id === id);
  if (!p) throw new Error(`Piece not found: ${id}`);
  return p;
}

// Helper: compute board coordinate (row, col) for a piece at current pos
export function coordOfPiece(piece: Piece): { row: number; col: number } {
  if (piece.owner === 'Light') {
    // horizontal lanes: row = laneIndex, col = pos
    return { row: piece.laneIndex, col: piece.pos };
  }
  // Dark vertical lanes: row = pos, col = laneIndex
  return { row: piece.pos, col: piece.laneIndex };
}

// Helper: Determine if an opponent occupies the intersection at (owner, laneIndex, pos)
function getOpponentsAt(
  gs: GameState,
  owner: Player,
  laneIndex: number,
  pos: number,
): Piece[] {
  const meIsLight = owner === 'Light';
  const targetRow = meIsLight ? laneIndex : pos;
  const targetCol = meIsLight ? pos : laneIndex;
  const oppSide = other(owner);
  return gs.pieces.filter((q) => {
    if (q.owner !== oppSide) return false;
    if (q.state === 'retirada') return false;
    const { row, col } = coordOfPiece(q);
    return row === targetRow && col === targetCol;
  });
}

// Helper: Send a jumped opponent back to its corresponding edge
function sendBackToEdge(gs: GameState, opp: Piece): void {
  const lane: Lane = gs.lanesByPlayer[opp.owner][opp.laneIndex];
  if (opp.state === 'en_ida') {
    // back to start (salida), still en_ida
    opp.pos = 0;
  } else if (opp.state === 'en_vuelta') {
    // back to opposite (giro), still en_vuelta
    opp.pos = lane.length;
  }
}

// Count retired pieces for owner
function countRetired(gs: GameState, owner: Player): number {
  return gs.pieces.filter((p) => p.owner === owner && p.state === 'retirada').length;
}

/**
 * Move a piece by id according to Squadro rules.
 * - Steps forward by speed depending on state (en_ida/en_vuelta)
 * - Jumps over contiguous block(s) of opponents; stops in the first empty after the last
 * - Sends all jumped opponents back to their corresponding edge
 * - Turns at far edge and ends the move; retires at start edge when returning
 */
export function movePiece(gs: GameState, pieceId: string): GameState {
  const p = getPiece(gs, pieceId);
  if (gs.winner) return gs; // game already ended
  if (p.state === 'retirada') throw new Error('La pieza ya fue retirada');
  if (p.owner !== gs.turn) throw new Error('No es el turno de esta pieza');

  const lane = gs.lanesByPlayer[p.owner][p.laneIndex];
  const dir = p.state === 'en_ida' ? +1 : -1;
  const speed = p.state === 'en_ida' ? lane.speedOut : lane.speedBack;

  let stepsLeft = speed;
  let pos = p.pos;

  while (stepsLeft > 0) {
    const next = pos + dir;
    // Clamp to edges if would go beyond
    if (next < 0) {
      pos = 0;
      stepsLeft = 0;
    } else if (next > lane.length) {
      pos = lane.length;
      stepsLeft = 0;
    } else {
      pos = next;
      stepsLeft--;

      // Check opponents at this intersection
      const oppsHere = getOpponentsAt(gs, p.owner, p.laneIndex, pos);
      if (oppsHere.length > 0) {
        // Find the last contiguous position with opponents in the moving direction
        let lastBlockPos = pos;
        const jumpedOpps: Piece[] = [...oppsHere];
        while (true) {
          const probe = lastBlockPos + dir;
          if (probe < 0 || probe > lane.length) break;
          const more = getOpponentsAt(gs, p.owner, p.laneIndex, probe);
          if (more.length > 0) {
            lastBlockPos = probe;
            jumpedOpps.push(...more);
          } else {
            break;
          }
        }

        // Send back ALL jumped opponents
        // Use a Set to avoid duplicate handling if any logical overlap occurs
        const uniq = new Set(jumpedOpps.map((x) => x.id));
        for (const id of uniq) {
          const q = gs.pieces.find((x) => x.id === id)!;
          sendBackToEdge(gs, q);
        }

        // Stop immediately after last jumped piece (first empty)
        const stopPos = lastBlockPos + dir;
        pos = Math.max(0, Math.min(lane.length, stopPos));
        stepsLeft = 0; // jump always ends movement
      }

      // Edge check after normal step or jump stop
      if (pos === lane.length && p.state === 'en_ida') {
        p.state = 'en_vuelta';
        stepsLeft = 0; // turn and end
      } else if (pos === 0 && p.state === 'en_vuelta') {
        p.state = 'retirada';
        stepsLeft = 0; // retire
      }
    }
  }

  // Commit final position if not retired
  if (p.state !== 'retirada') {
    p.pos = pos;
  } else {
    // ensure retired pieces don't interfere with future intersections
    p.pos = 0; // stays off-board semantically
  }

  // Check victory (4 retired of the same player)
  if (countRetired(gs, p.owner) >= 4) {
    gs.winner = p.owner;
  }

  // Alternate turn if no winner
  if (!gs.winner) {
    gs.turn = other(p.owner);
  }

  return gs;
}

