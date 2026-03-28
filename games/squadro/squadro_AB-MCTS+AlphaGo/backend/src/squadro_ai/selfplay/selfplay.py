from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import hashlib
import math
import time

from ..game.state import GameState, Player, clone_state, create_initial_state
from ..game.rules import legal_moves, move_piece
from ..mcts import MCTSConfig, mcts_policy
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


@dataclass
class SelfPlayGameStats:
  winner: str | None
  plies: int
  samples: int
  avg_entropy: float
  avg_top_p: float
  game_hash: str
  duration_s: float


def play_one_game(
  policy_value_fn: PolicyValueFn,
  mcts_config: MCTSConfig,
  max_moves: int = 200,
  temperature: float = 1.0,
  temperature_moves: int = 10,
) -> List[SelfPlaySample]:
  """Play a full self-play game and return training samples.

  For now the policy target ``pi`` is a *delta* distribution concentrated on
  the move chosen by MCTS (no visit-count distribution yet). This is already
  useful to train the network to imitate MCTS decisions.
  """

  samples, _stats = play_one_game_with_stats(
    policy_value_fn=policy_value_fn,
    mcts_config=mcts_config,
    max_moves=max_moves,
    temperature=temperature,
    temperature_moves=temperature_moves,
  )
  return samples


def play_one_game_with_stats(
  policy_value_fn: PolicyValueFn,
  mcts_config: MCTSConfig,
  max_moves: int = 200,
  temperature: float = 1.0,
  temperature_moves: int = 10,
) -> tuple[List[SelfPlaySample], SelfPlayGameStats]:
  t0 = time.time()
  state = create_initial_state()
  history: List[tuple[GameState, Dict[str, float], Player]] = []
  moves: list[str] = []
  entropies: list[float] = []
  top_ps: list[float] = []
  moves_played = 0

  while state.winner is None and moves_played < max_moves:
    legal = legal_moves(state)
    if not legal:
      break

    temp = float(temperature) if moves_played < int(temperature_moves) else 0.0
    pi, move_id = mcts_policy(state, mcts_config, policy_value_fn, temperature=temp)
    if move_id is None:
      break

    if not pi:
      pi = {m: 1.0 / float(len(legal)) for m in legal}

    pvals = list(pi.values())
    if pvals:
      ent = 0.0
      for p in pvals:
        if p > 0.0:
          ent -= float(p) * math.log(float(p) + 1e-12)
      entropies.append(ent)
      top_ps.append(float(max(pvals)))

    history.append((clone_state(state), pi, state.turn))
    moves.append(move_id)
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

  avg_entropy = (sum(entropies) / float(len(entropies))) if entropies else 0.0
  avg_top_p = (sum(top_ps) / float(len(top_ps))) if top_ps else 0.0
  game_hash = hashlib.sha1(" ".join(moves).encode("utf-8")).hexdigest()[:12]
  duration_s = float(time.time() - t0)
  stats = SelfPlayGameStats(
    winner=winner,
    plies=int(moves_played),
    samples=int(len(samples)),
    avg_entropy=float(avg_entropy),
    avg_top_p=float(avg_top_p),
    game_hash=game_hash,
    duration_s=duration_s,
  )
  return samples, stats


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
