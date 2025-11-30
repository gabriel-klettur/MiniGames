from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Sequence, Tuple

import torch
import torch.nn as nn
import torch.nn.functional as F

from ..game.state import GameState, Player, DEFAULT_LANE_LENGTH
from ..game.rules import move_piece  # imported for type hints / potential use
from .interfaces import PolicyValueFn
from .heuristic import _retired_advantage_value  # reuse simple value as fallback/regularizer


BOARD_SIZE: int = DEFAULT_LANE_LENGTH + 1
PIECE_IDS: Tuple[str, ...] = (
    "L0",
    "L1",
    "L2",
    "L3",
    "L4",
    "D0",
    "D1",
    "D2",
    "D3",
    "D4",
)
PIECE_ID_TO_INDEX: Dict[str, int] = {pid: i for i, pid in enumerate(PIECE_IDS)}


class SquadroPolicyValueNet(nn.Module):
    """Small convolutional policy/value network for Squadro.

    The network consumes a tensor of shape ``(B, C, H, W)`` where

    - ``C`` are feature planes derived from the :class:`GameState`.
    - ``H=W=BOARD_SIZE`` (7 with the default configuration).

    It produces:

    - ``policy_logits`` of shape ``(B, len(PIECE_IDS))``
    - ``value`` of shape ``(B,)`` in the range ``[-1, 1]`` after ``tanh``.
    """

    def __init__(self, in_channels: int = 6, channels: int = 64) -> None:
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, channels, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(channels, channels, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(channels, channels, kernel_size=3, padding=1)

        flat_size = channels * BOARD_SIZE * BOARD_SIZE
        self.policy_head = nn.Linear(flat_size, len(PIECE_IDS))
        self.value_fc1 = nn.Linear(flat_size, channels)
        self.value_fc2 = nn.Linear(channels, 1)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        h = F.relu(self.conv1(x))
        h = F.relu(self.conv2(h))
        h = F.relu(self.conv3(h))
        h = torch.flatten(h, start_dim=1)

        policy_logits = self.policy_head(h)
        v = F.relu(self.value_fc1(h))
        v = torch.tanh(self.value_fc2(v)).squeeze(-1)
        return policy_logits, v


def encode_state(state: GameState, device: torch.device | None = None) -> torch.Tensor:
    """Encode a :class:`GameState` into a tensor suitable for the network.

    Channels (C=6):

    0. Light pieces going out (``en_ida``)
    1. Light pieces returning (``en_vuelta``)
    2. Dark pieces going out
    3. Dark pieces returning
    4. Scalar plane with Light retired fraction (0..1)
    5. Scalar plane with Dark retired fraction (0..1)
    """

    device = device or torch.device("cpu")
    x = torch.zeros((1, 6, BOARD_SIZE, BOARD_SIZE), dtype=torch.float32, device=device)

    def _coord_of(owner: Player, lane_index: int, pos: int) -> Tuple[int, int]:
        L = DEFAULT_LANE_LENGTH
        offset = 1
        if owner == "Light":
            return lane_index + offset, L - pos
        return L - pos, lane_index + offset

    for piece in state.pieces:
        if piece.state == "retirada":
            continue
        row, col = _coord_of(piece.owner, piece.lane_index, piece.pos)
        if not (0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE):
            continue
        if piece.owner == "Light":
            ch = 0 if piece.state == "en_ida" else 1
        else:
            ch = 2 if piece.state == "en_ida" else 3
        x[0, ch, row, col] = 1.0

    # Retired counts as global context
    light_retired = sum(1 for p in state.pieces if p.owner == "Light" and p.state == "retirada")
    dark_retired = sum(1 for p in state.pieces if p.owner == "Dark" and p.state == "retirada")
    x[0, 4, :, :] = float(light_retired) / 4.0
    x[0, 5, :, :] = float(dark_retired) / 4.0

    return x


@dataclass
class TorchPolicyValueAdapter:
    """Adapter that turns a :class:`SquadroPolicyValueNet` into a PolicyValueFn.

    Parameters
    ----------
    model:
        The underlying PyTorch module.
    device:
        Device where the model and tensors live (``"cpu"`` by defecto).
    """

    model: SquadroPolicyValueNet
    device: torch.device = torch.device("cpu")

    def __post_init__(self) -> None:
        self.model.to(self.device)
        self.model.eval()

    def __call__(self, state: GameState, legal_moves: Sequence[str]) -> Tuple[Dict[str, float], float]:
        if not legal_moves:
            return {}, 0.0

        # Encode state
        with torch.no_grad():
            x = encode_state(state, device=self.device)
            policy_logits, value_tensor = self.model(x)

        # Map logits to legal moves using PIECE_IDS ordering
        logits_list: list[float] = []
        for move_id in legal_moves:
            idx = PIECE_ID_TO_INDEX.get(move_id)
            if idx is None:
                # Unknown id: give it a very low logit so it almost never gets picked
                logits_list.append(-1e9)
            else:
                logits_list.append(float(policy_logits[0, idx].item()))

        logits = torch.tensor(logits_list, dtype=torch.float32)
        probs = F.softmax(logits, dim=0).cpu().numpy()
        policy: Dict[str, float] = {m: float(p) for m, p in zip(legal_moves, probs)}

        # Clamp value to [-1, 1]
        value = float(value_tensor.item())
        value = max(-1.0, min(1.0, value))

        return policy, value
