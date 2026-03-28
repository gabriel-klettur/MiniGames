from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Literal, Optional
import copy

# --- Core types -------------------------------------------------------------

Player = Literal["Light", "Dark"]
PieceState = Literal["en_ida", "en_vuelta", "retirada"]

# Board configuration taken from the TypeScript implementation.
# There are 5 lanes per player; each lane has a length (0..length) and two
# speeds: one for the outward trip (en_ida) and one for the return
# (en_vuelta).

DEFAULT_LANE_LENGTH: int = 6

# Light (horizontal) starts at the right edge and goes left (out), then
# returns right (back).
LIGHT_OUT: List[int] = [3, 1, 2, 1, 3]
LIGHT_BACK: List[int] = [1, 3, 2, 3, 1]

# Dark (vertical) starts at the bottom edge and goes up (out), then returns
# down (back).
DARK_OUT: List[int] = [1, 3, 2, 3, 1]
DARK_BACK: List[int] = [3, 1, 2, 1, 3]


@dataclass
class Lane:
    """One lane of the Squadro board.

    Attributes
    ----------
    length:
        Number of discrete steps from one edge to the opposite edge.
    speed_out:
        How many steps a piece advances while going out (``en_ida``).
    speed_back:
        How many steps a piece advances while returning (``en_vuelta``).
    """

    length: int
    speed_out: int
    speed_back: int


@dataclass
class Piece:
    """Single Squadro piece.

    The ``pos`` attribute uses the logical lane coordinate:
    ``0`` = owner start edge, ``lane.length`` = opposite edge.
    """

    id: str
    owner: Player
    lane_index: int
    pos: int
    state: PieceState


@dataclass
class GameState:
    """Complete Squadro game state.

    This structure is intentionally compact and free of UI concerns so it can
    be copied cheaply and used by search algorithms.
    """

    lanes_by_player: Dict[Player, List[Lane]]
    pieces: List[Piece]
    turn: Player
    winner: Optional[Player] = None


# --- Construction helpers ---------------------------------------------------


def _create_player_lanes(length: int, speeds_out: List[int], speeds_back: List[int]) -> List[Lane]:
    if len(speeds_out) != 5 or len(speeds_back) != 5:
        raise ValueError("Expected 5 speeds for out/back per player")
    return [
        Lane(length=length, speed_out=s_out, speed_back=speeds_back[i])
        for i, s_out in enumerate(speeds_out)
    ]


def create_default_lanes_by_player(length: int = DEFAULT_LANE_LENGTH) -> Dict[Player, List[Lane]]:
    """Return canonical lane configuration for both players.

    The pattern matches the reference implementation and the visual board
    used in the frontend.
    """

    return {
        "Light": _create_player_lanes(length, LIGHT_OUT, LIGHT_BACK),
        "Dark": _create_player_lanes(length, DARK_OUT, DARK_BACK),
    }


def create_initial_pieces() -> List[Piece]:
    """Create the 10 initial pieces (5 per player) at position 0.

    Piece identifiers follow the convention used in the frontend:
    ``"L0".."L4"`` for Light and ``"D0".."D4"`` for Dark.
    """

    pieces: List[Piece] = []
    for owner in ("Light", "Dark"):
        for lane_index in range(5):
            pid = f"{owner[0]}{lane_index}"
            pieces.append(
                Piece(
                    id=pid,
                    owner=owner,  # type: ignore[arg-type]
                    lane_index=lane_index,
                    pos=0,
                    state="en_ida",
                )
            )
    return pieces


def create_initial_state() -> GameState:
    """Create the canonical initial state for a new Squadro game."""

    lanes_by_player = create_default_lanes_by_player()
    pieces = create_initial_pieces()
    return GameState(lanes_by_player=lanes_by_player, pieces=pieces, turn="Light")


def clone_state(state: GameState) -> GameState:
    """Deep copy a :class:`GameState`.

    MCTS relies on copying states frequently; using :func:`copy.deepcopy`
    keeps the implementation simple and correct. If profiling shows this is a
    bottleneck, we can replace it with a custom, faster copier.
    """

    return copy.deepcopy(state)
