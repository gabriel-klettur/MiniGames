from __future__ import annotations

from typing import Dict, Protocol, Sequence, Tuple

from ..game.state import GameState


class PolicyValueFn(Protocol):
    """Callable used by MCTS to obtain policy and value estimates.

    The function receives a :class:`GameState` and the list of legal moves in
    that state, and returns a pair ``(policy, value)`` where:

    - ``policy`` is a mapping from move id to prior probability.
    - ``value`` is a scalar in ``[-1, 1]`` estimating the win probability for
      the player to move.
    """

    def __call__(self, state: GameState, legal_moves: Sequence[str]) -> Tuple[Dict[str, float], float]:  # pragma: no cover - protocol
        ...
