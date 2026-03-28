"""Entry point for the Squadro MCTS / AlphaGo-style backend.

For now this module exposes a small CLI that runs MCTS from the initial
position using a simple heuristic policy/value function. Later it can be
extended to serve an HTTP API or to integrate a trained neural network.
"""

from __future__ import annotations

import argparse

from squadro_ai.game import GameState, create_initial_state
from squadro_ai.mcts import MCTSConfig, mcts_best_move
from squadro_ai.policy import heuristic_policy_value


def choose_best_move(state: GameState, simulations: int = 800) -> str | None:
    """Return the best move id for ``state`` using MCTS and the heuristic policy.

    This is a synchronous helper suited for offline analysis or simple CLI
    usage. For interactive play you would usually wrap this in a worker or a
    background task.
    """

    config = MCTSConfig(simulations=simulations)
    return mcts_best_move(state, config, heuristic_policy_value)


def main() -> None:
    parser = argparse.ArgumentParser(description="Squadro MCTS / AlphaGo backend demo")
    parser.add_argument(
        "--simulations",
        type=int,
        default=800,
        help="Number of MCTS simulations to run from the initial position (default: 800)",
    )
    args = parser.parse_args()

    state = create_initial_state()
    move_id = choose_best_move(state, simulations=args.simulations)
    if move_id is None:
        print("No legal moves from the initial position (this should not happen).")
    else:
        print(f"Best move from initial position with {args.simulations} simulations: {move_id}")


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    main()

