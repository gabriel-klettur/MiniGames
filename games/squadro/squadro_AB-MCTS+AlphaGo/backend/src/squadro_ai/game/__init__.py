"""Game engine for Squadro.

This subpackage defines the core data structures and rules for Squadro.
It is intentionally pure and side‑effect free so it can be used by search
algorithms, training loops and tests.
"""

from .state import (
    Player,
    PieceState,
    Lane,
    Piece,
    GameState,
    DEFAULT_LANE_LENGTH,
    create_initial_state,
    clone_state,
)
from .rules import legal_moves, move_piece

__all__ = [
    "Player",
    "PieceState",
    "Lane",
    "Piece",
    "GameState",
    "DEFAULT_LANE_LENGTH",
    "create_initial_state",
    "clone_state",
    "legal_moves",
    "move_piece",
]
