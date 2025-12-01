"""Benchmark de estrategias de IA para Squadro.

Enfrenta:
- MCTS + heurística fuerte (evaluate_strong).
- MCTS + red policy/value entrenada.

Ejemplo de uso:

    python benchmark_strategies.py --games 20 --simulations 200

Esto jugará 2 * games partidas:
- games con la red como Light y la heurística fuerte como Dark.
- games con los papeles invertidos.
"""

from __future__ import annotations

import argparse
import os
from typing import Callable, Sequence, Dict, Tuple

import torch

from squadro_ai.game import GameState, create_initial_state
from squadro_ai.mcts import MCTSConfig, mcts_best_move
from squadro_ai.policy import (
    SquadroPolicyValueNet,
    TorchPolicyValueAdapter,
    strong_heuristic_policy_value,
)
from squadro_ai.game.rules import move_piece


PolicyValueFn = Callable[[GameState, Sequence[str]], Tuple[Dict[str, float], float]]


def load_trained_adapter(device: torch.device) -> TorchPolicyValueAdapter:
    """Load the trained SquadroPolicyValueNet from models/, or warn if missing.

    If no checkpoint is found, the adapter will use random weights (useful as a
    sanity check, but weaker than the strong heuristic).
    """

    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    ckpt_path = os.path.abspath(os.path.join(models_dir, "squadro_policy_value.pt"))

    model = SquadroPolicyValueNet()
    if os.path.exists(ckpt_path):
        state_dict = torch.load(ckpt_path, map_location=device)
        model.load_state_dict(state_dict)
        print(f"[load] Loaded trained model from: {ckpt_path}")
    else:
        print(f"[load] WARNING: checkpoint not found at {ckpt_path}, using random weights")

    return TorchPolicyValueAdapter(model, device=device)


def play_match(
    light_fn: PolicyValueFn,
    dark_fn: PolicyValueFn,
    config: MCTSConfig,
    max_moves: int,
) -> str | None:
    """Play a single game and return the winner: 'Light', 'Dark', or None for draw."""

    state = create_initial_state()
    moves = 0
    while state.winner is None and moves < max_moves:
        policy_value_fn = light_fn if state.turn == "Light" else dark_fn
        move_id = mcts_best_move(state, config, policy_value_fn)
        if move_id is None:
            break
        move_piece(state, move_id)
        moves += 1

    return state.winner


def benchmark_strategies(games: int, simulations: int, max_moves: int) -> None:
    device = torch.device("cpu")
    net_adapter = load_trained_adapter(device)

    config = MCTSConfig(simulations=simulations)

    net_wins = 0
    strong_wins = 0
    draws = 0

    for i in range(1, games + 1):
        print(f"\n[series] Round {i}/{games} — net as Light, strong heuristic as Dark")
        winner = play_match(net_adapter, strong_heuristic_policy_value, config, max_moves)
        if winner == "Light":
            net_wins += 1
        elif winner == "Dark":
            strong_wins += 1
        else:
            draws += 1
        print(f"[result] Winner: {winner}")

        print(f"[series] Round {i}/{games} — strong heuristic as Light, net as Dark")
        winner = play_match(strong_heuristic_policy_value, net_adapter, config, max_moves)
        if winner == "Light":
            strong_wins += 1
        elif winner == "Dark":
            net_wins += 1
        else:
            draws += 1
        print(f"[result] Winner: {winner}")

    total_games = 2 * games
    net_score = net_wins + 0.5 * draws
    strong_score = strong_wins + 0.5 * draws

    print("\n===== Benchmark summary =====")
    print(f"Total games: {total_games}")
    print(f"Net wins: {net_wins}")
    print(f"Strong heuristic wins: {strong_wins}")
    print(f"Draws: {draws}")
    print(f"Net score (wins+0.5*draws): {net_score:.1f}")
    print(f"Strong heuristic score: {strong_score:.1f}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark Squadro AI strategies")
    parser.add_argument("--games", type=int, default=10, help="Games per side (total games = 2*games)")
    parser.add_argument("--simulations", type=int, default=200, help="MCTS simulations per move")
    parser.add_argument("--max-moves", type=int, default=150, help="Max plies per game before declaring a draw")
    args = parser.parse_args()

    benchmark_strategies(games=args.games, simulations=args.simulations, max_moves=args.max_moves)


if __name__ == "__main__":
    main()
