"""Arena script: compare two policy/value checkpoints by playing head-to-head games.

This script alternates colors to reduce bias and reports win-rate plus an
approximate Elo difference.

Example:
    python arena_checkpoints.py --ckpt-a ../models/checkpoints/squadro_policy_value_epoch_000100.pt \
        --ckpt-b ../models/checkpoints/squadro_policy_value_epoch_000200.pt --games 50
"""

from __future__ import annotations

import argparse
import hashlib
import math
import os
import random
from dataclasses import dataclass
from typing import Optional

import numpy as np
import torch

from squadro_ai.game import GameState, create_initial_state
from squadro_ai.game.rules import move_piece
from squadro_ai.mcts import MCTSConfig, mcts_best_move
from squadro_ai.policy import SquadroPolicyValueNet, TorchPolicyValueAdapter


@dataclass
class MatchResult:
    winner: str | None
    moves: list[str]


def _load_adapter(ckpt_path: str, device: torch.device) -> TorchPolicyValueAdapter:
    model = SquadroPolicyValueNet()
    state_dict = torch.load(ckpt_path, map_location=device)
    model.load_state_dict(state_dict)
    return TorchPolicyValueAdapter(model, device=device)


def _play_match(
    light_fn: TorchPolicyValueAdapter,
    dark_fn: TorchPolicyValueAdapter,
    config: MCTSConfig,
    max_moves: int,
) -> MatchResult:
    state: GameState = create_initial_state()
    moves = 0
    seq: list[str] = []
    while state.winner is None and moves < max_moves:
        fn = light_fn if state.turn == "Light" else dark_fn
        move_id = mcts_best_move(state, config, fn)
        if move_id is None:
            break
        seq.append(move_id)
        move_piece(state, move_id)
        moves += 1
    return MatchResult(winner=state.winner, moves=seq)


def _elo_from_score(score: float) -> float:
    """Approximate Elo difference from a score in (0,1)."""

    eps = 1e-6
    s = max(eps, min(1.0 - eps, float(score)))
    return 400.0 * math.log10(s / (1.0 - s))


def _hash_moves(moves: list[str]) -> str:
    return hashlib.sha1(" ".join(moves).encode("utf-8")).hexdigest()[:12]


def main() -> None:
    parser = argparse.ArgumentParser(description="Arena: checkpoint vs checkpoint")
    parser.add_argument("--ckpt-a", required=True, help="Path to checkpoint A (.pt)")
    parser.add_argument("--ckpt-b", required=True, help="Path to checkpoint B (.pt)")
    parser.add_argument("--games", type=int, default=20, help="Rounds (total games = 2*games)")
    parser.add_argument("--simulations", type=int, default=200, help="MCTS simulations per move")
    parser.add_argument("--max-moves", type=int, default=150, help="Max plies per game before draw")
    parser.add_argument("--seed", type=int, default=None, help="Seed for reproducibility")
    parser.add_argument("--print-moves", action="store_true", help="Print full move list")
    parser.add_argument("--dirichlet-alpha", type=float, default=0.0, help="Dirichlet alpha at root (0 disables)")
    parser.add_argument("--dirichlet-frac", type=float, default=0.0, help="Fraction of prior replaced by Dirichlet noise")
    args = parser.parse_args()

    ckpt_a = os.path.abspath(args.ckpt_a)
    ckpt_b = os.path.abspath(args.ckpt_b)
    if not os.path.exists(ckpt_a):
        raise FileNotFoundError(f"Checkpoint A not found: {ckpt_a}")
    if not os.path.exists(ckpt_b):
        raise FileNotFoundError(f"Checkpoint B not found: {ckpt_b}")

    if args.seed is not None:
        random.seed(args.seed)
        np.random.seed(args.seed)
        torch.manual_seed(args.seed)

    device = torch.device("cpu")
    a_adapter = _load_adapter(ckpt_a, device)
    b_adapter = _load_adapter(ckpt_b, device)

    cfg = MCTSConfig(
        simulations=int(args.simulations),
        dirichlet_alpha=float(args.dirichlet_alpha),
        dirichlet_frac=float(args.dirichlet_frac),
    )

    a_wins = 0
    b_wins = 0
    draws = 0
    seen: set[str] = set()

    for i in range(1, int(args.games) + 1):
        print(f"\n[series] Round {i}/{args.games} — A as Light, B as Dark")
        res = _play_match(a_adapter, b_adapter, cfg, int(args.max_moves))
        digest = _hash_moves(res.moves)
        repeat = digest in seen
        seen.add(digest)
        if res.winner == "Light":
            a_wins += 1
        elif res.winner == "Dark":
            b_wins += 1
        else:
            draws += 1
        print(f"[result] Winner: {res.winner}")
        print(f"[game] plies={len(res.moves)} hash={digest}{' REPEAT' if repeat else ''}")
        if args.print_moves:
            print(f"[moves] {res.moves}")

        print(f"[series] Round {i}/{args.games} — B as Light, A as Dark")
        res = _play_match(b_adapter, a_adapter, cfg, int(args.max_moves))
        digest = _hash_moves(res.moves)
        repeat = digest in seen
        seen.add(digest)
        if res.winner == "Light":
            b_wins += 1
        elif res.winner == "Dark":
            a_wins += 1
        else:
            draws += 1
        print(f"[result] Winner: {res.winner}")
        print(f"[game] plies={len(res.moves)} hash={digest}{' REPEAT' if repeat else ''}")
        if args.print_moves:
            print(f"[moves] {res.moves}")

    total_games = 2 * int(args.games)
    a_score = a_wins + 0.5 * draws
    score_rate = a_score / float(total_games) if total_games > 0 else 0.0
    elo = _elo_from_score(score_rate)

    print("\n===== Arena summary =====")
    print(f"A: {ckpt_a}")
    print(f"B: {ckpt_b}")
    print(f"Total games: {total_games}")
    print(f"A wins: {a_wins}")
    print(f"B wins: {b_wins}")
    print(f"Draws: {draws}")
    print(f"A score rate: {score_rate:.3f}")
    print(f"Approx Elo(A-B): {elo:+.1f}")


if __name__ == "__main__":
    main()
