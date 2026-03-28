"""Monte Carlo Tree Search (MCTS) for Squadro.

The main entry point is :func:`mcts_best_move`, which runs a number of
simulations from a root :class:`~squadro_ai.game.state.GameState` and returns
an action identifier (piece id) to play.
"""

from .mcts import MCTSConfig, mcts_best_move, mcts_policy

__all__ = ["MCTSConfig", "mcts_best_move", "mcts_policy"]
