from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from ..game.state import GameState, Player, clone_state, create_initial_state
from ..game.rules import legal_moves, move_piece
from ..mcts import MCTSConfig, mcts_best_move
from ..policy import PolicyValueFn


@dataclass
class SelfPlaySample:
  """Single training sample from self-play.

  Attributes
  ----------
  state:
      Game state before playing a move.
  pi:
      Policy target: probability distribution over legal moves in ``state``.
  z:
      Game outcome from the perspective of the player to move in ``state``;
      ``+1`` for win, ``-1`` for loss, ``0`` for draw/unknown.
  """

  state: GameState
  pi: Dict[str, float]
  z: float


def play_one_game(
  policy_value_fn: PolicyValueFn,
  mcts_config: MCTSConfig,
  max_moves: int = 200,
) -> List[SelfPlaySample]:
  """Play a full self-play game and return training samples.

  For now the policy target ``pi`` is a *delta* distribution concentrated on
  the move chosen by MCTS (no visit-count distribution yet). This is already
  useful to train the network to imitate MCTS decisions.
  """

  state = create_initial_state()
  history: List[tuple[GameState, Dict[str, float], Player]] = []
  moves_played = 0

  while state.winner is None and moves_played < max_moves:
    legal = legal_moves(state)
    if not legal:
      break

    move_id = mcts_best_move(state, mcts_config, policy_value_fn)
    if move_id is None:
      break

    # Delta policy: probability 1 on the chosen move, 0 on the rest
    pi: Dict[str, float] = {m: 0.0 for m in legal}
    pi[move_id] = 1.0

    history.append((clone_state(state), pi, state.turn))
    move_piece(state, move_id)
    moves_played += 1

  winner = state.winner
  samples: List[SelfPlaySample] = []
  for s, pi, player in history:
    if winner is None:
      z = 0.0
    else:
      z = 1.0 if winner == player else -1.0
    samples.append(SelfPlaySample(state=s, pi=pi, z=z))

  return samples


def generate_self_play_samples(
  policy_value_fn: PolicyValueFn,
  mcts_config: MCTSConfig,
  games: int,
  max_moves: int = 200,
) -> List[SelfPlaySample]:
  """Run multiple self-play games and aggregate all samples."""

  all_samples: List[SelfPlaySample] = []
  for _ in range(max(1, games)):
    all_samples.extend(play_one_game(policy_value_fn, mcts_config, max_moves=max_moves))
  return all_samples
