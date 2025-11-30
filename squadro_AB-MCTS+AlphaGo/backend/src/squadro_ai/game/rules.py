from __future__ import annotations

from typing import List, Tuple

from .state import GameState, Lane, Piece, Player, PieceState, DEFAULT_LANE_LENGTH


# --- Helpers ---------------------------------------------------------------


def other(player: Player) -> Player:
    return "Dark" if player == "Light" else "Light"


def get_piece(state: GameState, piece_id: str) -> Piece:
    for p in state.pieces:
        if p.id == piece_id:
            return p
    raise KeyError(f"Piece not found: {piece_id}")


def coord_of(owner: Player, lane_index: int, pos: int) -> Tuple[int, int]:
    """Map lane coordinates to board (row, col) intersections.

    This mirrors the TypeScript implementation so collisions and jumps behave
    identically to the frontend engine.
    """

    L = DEFAULT_LANE_LENGTH
    offset = 1
    if owner == "Light":
        return lane_index + offset, L - pos
    return L - pos, lane_index + offset


def coord_of_piece(piece: Piece) -> Tuple[int, int]:
    return coord_of(piece.owner, piece.lane_index, piece.pos)


def _get_opponents_at(state: GameState, owner: Player, lane_index: int, pos: int) -> List[Piece]:
    target_row, target_col = coord_of(owner, lane_index, pos)
    opp_side = other(owner)
    result: List[Piece] = []
    for q in state.pieces:
        if q.owner != opp_side:
            continue
        if q.state == "retirada":
            continue
        row, col = coord_of_piece(q)
        if row == target_row and col == target_col:
            result.append(q)
    return result


def _send_back_to_edge(state: GameState, opp: Piece) -> None:
    lane: Lane = state.lanes_by_player[opp.owner][opp.lane_index]
    if opp.state == "en_ida":
        opp.pos = 0
    elif opp.state == "en_vuelta":
        opp.pos = lane.length


def _count_retired(state: GameState, owner: Player) -> int:
    return sum(1 for p in state.pieces if p.owner == owner and p.state == "retirada")


# --- Public API ------------------------------------------------------------


def legal_moves(state: GameState) -> List[str]:
    """Return all legal moves in the current position.

    In Squadro a move is uniquely identified by the piece id; a piece is
    playable iff it belongs to the side to move and has not been retired.
    """

    if state.winner is not None:
        return []
    return [p.id for p in state.pieces if p.owner == state.turn and p.state != "retirada"]


def move_piece(state: GameState, piece_id: str) -> None:
    """Apply Squadro movement rules for the given piece id.

    The function mutates ``state`` in place and updates turn and winner. Its
    behaviour mirrors the frontend implementation so both engines stay in
    sync.
    """

    p = get_piece(state, piece_id)
    if state.winner is not None:
        return
    if p.state == "retirada":
        raise ValueError("Piece is already retired")
    if p.owner != state.turn:
        raise ValueError("It is not this piece's turn")

    lane: Lane = state.lanes_by_player[p.owner][p.lane_index]
    direction = 1 if p.state == "en_ida" else -1
    speed = lane.speed_out if p.state == "en_ida" else lane.speed_back

    steps_left = speed
    pos = p.pos

    while steps_left > 0:
        next_pos = pos + direction
        # Clamp to edges if we would go beyond
        if next_pos < 0:
            pos = 0
            steps_left = 0
        elif next_pos > lane.length:
            pos = lane.length
            steps_left = 0
        else:
            pos = next_pos
            steps_left -= 1

            # Check opponents at this intersection
            opps_here = _get_opponents_at(state, p.owner, p.lane_index, pos)
            if opps_here:
                # Find the last contiguous position with opponents
                last_block_pos = pos
                jumped_opps: List[Piece] = list(opps_here)
                while True:
                    probe = last_block_pos + direction
                    if probe < 0 or probe > lane.length:
                        break
                    more = _get_opponents_at(state, p.owner, p.lane_index, probe)
                    if not more:
                        break
                    last_block_pos = probe
                    jumped_opps.extend(more)

                # Send back all jumped opponents
                seen_ids = {q.id for q in jumped_opps}
                for qid in seen_ids:
                    q = get_piece(state, qid)
                    _send_back_to_edge(state, q)

                # Stop immediately after last jumped piece
                stop_pos = last_block_pos + direction
                pos = max(0, min(lane.length, stop_pos))
                steps_left = 0

            # Edge checks after normal step or jump stop
            if pos == lane.length and p.state == "en_ida":
                p.state = "en_vuelta"
                steps_left = 0
            elif pos == 0 and p.state == "en_vuelta":
                p.state = "retirada"
                steps_left = 0

    # Post-loop normalization: state transitions when clamped beyond edges
    if p.state != "retirada":
        if pos == lane.length and p.state == "en_ida":
            p.state = "en_vuelta"
        elif pos == 0 and p.state == "en_vuelta":
            p.state = "retirada"

    # Commit final position
    if p.state != "retirada":
        p.pos = pos
    else:
        p.pos = 0

    # Victory: first player to retire 4 pieces
    if _count_retired(state, p.owner) >= 4:
        state.winner = p.owner

    # Alternate turn if no winner
    if state.winner is None:
        state.turn = other(p.owner)
