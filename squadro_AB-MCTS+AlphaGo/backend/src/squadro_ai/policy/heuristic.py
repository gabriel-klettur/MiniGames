from __future__ import annotations

from typing import Dict, Sequence, Tuple

from ..game.state import GameState, Player
from .interfaces import PolicyValueFn


def heuristic_policy_value(state: GameState, legal: Sequence[str]) -> Tuple[Dict[str, float], float]:
    """Simple handcrafted policy/value function for Squadro.

    - Policy: uniform over legal moves.
    - Value: based on retired pieces difference, mapped to ``[-1, 1]``.

    This is sufficient to get a working MCTS while a neural network is being
    developed and trained.
    """

    if not legal:
        return {}, 0.0

    p = 1.0 / float(len(legal))
    policy: Dict[str, float] = {m: p for m in legal}
    value = _retired_advantage_value(state, state.turn)
    return policy, value


def _retired_advantage_value(state: GameState, player: Player) -> float:
    """Return a coarse value in ``[-1, 1]`` based on retired pieces.

    +1.0 means a sure win for ``player``, -1.0 a sure loss, and 0.0 is
    approximately equal. The scale is deliberately soft; MCTS will refine the
    evaluation through search.
    """

    my_retired = sum(1 for p in state.pieces if p.owner == player and p.state == "retirada")
    opp: Player = "Dark" if player == "Light" else "Light"
    opp_retired = sum(1 for p in state.pieces if p.owner == opp and p.state == "retirada")
    diff = my_retired - opp_retired
    # Maximum relevant difference in Squadro is 4 pieces
    return max(-1.0, min(1.0, diff / 4.0))
