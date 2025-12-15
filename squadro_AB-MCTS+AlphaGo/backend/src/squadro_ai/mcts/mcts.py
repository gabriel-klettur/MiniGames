from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Optional
import math
import random

import numpy as np

from ..game.state import GameState, Player, clone_state
from ..game.rules import legal_moves, move_piece
from ..policy.interfaces import PolicyValueFn


@dataclass
class MCTSConfig:
    """Configuration parameters for MCTS.

    Attributes
    ----------
    simulations:
        Number of Monte Carlo simulations to run from the root.
    c_puct:
        Exploration constant used in the PUCT formula.
    dirichlet_alpha:
        Alpha parameter for Dirichlet noise at the root (0 disables).
    dirichlet_frac:
        Fraction of prior replaced by Dirichlet noise at the root.
    """

    simulations: int = 800
    c_puct: float = 1.4
    dirichlet_alpha: float = 0.3
    dirichlet_frac: float = 0.25


@dataclass
class _Node:
    state: GameState
    to_play: Player
    parent: Optional["_Node"] = None
    parent_action: Optional[str] = None
    prior: float = 0.0
    N: int = 0
    W: float = 0.0
    Q: float = 0.0
    children: Dict[str, "_Node"] = field(default_factory=dict)
    terminal: bool = False


def mcts_best_move(root_state: GameState, config: MCTSConfig, policy_value_fn: PolicyValueFn) -> Optional[str]:
    """Run MCTS from ``root_state`` and return the best move id.

    The best move is the one with the highest visit count at the root after
    ``config.simulations`` simulations.
    """

    if root_state.winner is not None:
        return None

    legal = legal_moves(root_state)
    if not legal:
        return None

    root = _Node(state=clone_state(root_state), to_play=root_state.turn)
    _expand(root, policy_value_fn, is_root=True, config=config)

    for _ in range(max(1, config.simulations)):
        node = root
        # Selection
        while node.children and not node.terminal:
            node = _select_child(node, config.c_puct)
        # Evaluation / expansion
        if node.terminal or node.state.winner is not None:
            value = _terminal_value(node.state, node.to_play)
        else:
            value = _expand(node, policy_value_fn, is_root=False, config=config)
        # Backup
        _backpropagate(node, value)

    if not root.children:
        return None

    # Choose the move with the highest visit count
    best_move, _ = max(root.children.items(), key=lambda kv: kv[1].N)
    return best_move


def mcts_policy(
    root_state: GameState,
    config: MCTSConfig,
    policy_value_fn: PolicyValueFn,
    *,
    temperature: float = 1.0,
) -> tuple[Dict[str, float], Optional[str]]:
    """Run MCTS and return a policy target (from root visits) and a selected move.

    The returned policy maps *all* legal moves to probabilities derived from
    the visit counts at the root. The selected move is sampled from that
    distribution when ``temperature > 0``; if ``temperature <= 0`` it becomes
    deterministic (argmax).
    """

    if root_state.winner is not None:
        return {}, None

    legal = legal_moves(root_state)
    if not legal:
        return {}, None

    root = _Node(state=clone_state(root_state), to_play=root_state.turn)
    _expand(root, policy_value_fn, is_root=True, config=config)

    for _ in range(max(1, config.simulations)):
        node = root
        while node.children and not node.terminal:
            node = _select_child(node, config.c_puct)
        if node.terminal or node.state.winner is not None:
            value = _terminal_value(node.state, node.to_play)
        else:
            value = _expand(node, policy_value_fn, is_root=False, config=config)
        _backpropagate(node, value)

    if not root.children:
        return {}, None

    visits: Dict[str, int] = {move_id: child.N for move_id, child in root.children.items()}
    pi = _visits_to_policy(visits, temperature=temperature)
    move_id = _select_move_from_policy(pi, visits, temperature=temperature)
    return pi, move_id


def _visits_to_policy(visits: Dict[str, int], *, temperature: float) -> Dict[str, float]:
    if not visits:
        return {}

    if temperature <= 1e-8:
        best = max(visits.items(), key=lambda kv: kv[1])[0]
        return {m: (1.0 if m == best else 0.0) for m in visits.keys()}

    inv_temp = 1.0 / float(temperature)
    weights: Dict[str, float] = {m: float(n) ** inv_temp for m, n in visits.items()}
    total = sum(weights.values())
    if total <= 0.0:
        uniform = 1.0 / float(len(visits))
        return {m: uniform for m in visits.keys()}
    return {m: (w / total) for m, w in weights.items()}


def _select_move_from_policy(
    pi: Dict[str, float],
    visits: Dict[str, int],
    *,
    temperature: float,
) -> Optional[str]:
    if not pi:
        return None
    if temperature <= 1e-8:
        return max(visits.items(), key=lambda kv: kv[1])[0]
    moves = list(pi.keys())
    probs = [pi[m] for m in moves]
    return random.choices(moves, weights=probs, k=1)[0]


def _expand(node: _Node, policy_value_fn: PolicyValueFn, *, is_root: bool, config: MCTSConfig) -> float:
    if node.state.winner is not None:
        node.terminal = True
        return _terminal_value(node.state, node.to_play)

    legal = legal_moves(node.state)
    if not legal:
        node.terminal = True
        return 0.0

    policy, value = policy_value_fn(node.state, legal)
    # Normalise and clamp small/negative priors
    priors = {m: max(0.0, policy.get(m, 0.0)) for m in legal}
    total = sum(priors.values()) or 1.0
    for m in legal:
        priors[m] /= total

    # Apply Dirichlet noise at root for exploration
    if is_root and config.dirichlet_alpha > 0.0 and len(legal) > 1:
        noise = np.random.dirichlet([config.dirichlet_alpha] * len(legal))
        mixed: Dict[str, float] = {}
        for m, eps in zip(legal, noise):
            mixed[m] = (1.0 - config.dirichlet_frac) * priors[m] + config.dirichlet_frac * float(eps)
        priors = mixed

    for move_id in legal:
        next_state = clone_state(node.state)
        move_piece(next_state, move_id)
        child = _Node(
            state=next_state,
            to_play=next_state.turn,
            parent=node,
            parent_action=move_id,
            prior=priors[move_id],
            terminal=next_state.winner is not None,
        )
        node.children[move_id] = child

    return float(value)


def _select_child(node: _Node, c_puct: float) -> _Node:
    assert node.children, "Cannot select child from a leaf node"
    total_visits = sum(child.N for child in node.children.values()) or 1
    best_score = -float("inf")
    best_child: Optional[_Node] = None
    for child in node.children.values():
        u = c_puct * child.prior * math.sqrt(total_visits) / (1 + child.N)
        score = child.Q + u
        if score > best_score:
            best_score = score
            best_child = child
    assert best_child is not None
    return best_child


def _terminal_value(state: GameState, player: Player) -> float:
    if state.winner is None:
        return 0.0
    if state.winner == player:
        return 1.0
    return -1.0


def _backpropagate(node: _Node, value: float) -> None:
    cur: Optional[_Node] = node
    v = value
    while cur is not None:
        cur.N += 1
        cur.W += v
        cur.Q = cur.W / float(cur.N)
        v = -v
        cur = cur.parent
