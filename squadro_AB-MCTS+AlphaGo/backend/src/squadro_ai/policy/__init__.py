"""Policy / value interfaces for guiding MCTS.

- :mod:`interfaces` define the abstract callable used by MCTS.
- :mod:`heuristic` contains a simple handcrafted policy/value function which
  can be used before a neural network is trained.
- :mod:`torch_net` provides a small convolutional policy/value network and
  an adapter that implements :class:`PolicyValueFn` using PyTorch.
"""

from .interfaces import PolicyValueFn
from .heuristic import heuristic_policy_value
from .torch_net import (
    SquadroPolicyValueNet,
    TorchPolicyValueAdapter,
    PIECE_IDS,
)

__all__ = [
    "PolicyValueFn",
    "heuristic_policy_value",
    "SquadroPolicyValueNet",
    "TorchPolicyValueAdapter",
    "PIECE_IDS",
]
