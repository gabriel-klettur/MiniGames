"""High-level API for the Squadro MCTS/AlphaGo-style engine.

This package provides:
- A pure Python game engine for Squadro.
- A generic MCTS implementation.
- A pluggable policy/value interface (heuristic or neural network).
"""

from .game.state import GameState, Player, Piece, Lane, create_initial_state
from .game.rules import legal_moves, move_piece
from .mcts.mcts import MCTSConfig, mcts_best_move
from .policy.heuristic import heuristic_policy_value

__all__ = [
    "GameState",
    "Player",
    "Piece",
    "Lane",
    "create_initial_state",
    "legal_moves",
    "move_piece",
    "MCTSConfig",
    "mcts_best_move",
    "heuristic_policy_value",
]
